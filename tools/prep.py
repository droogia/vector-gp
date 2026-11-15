import os
import json,math,numpy as np
from scipy.spatial import cKDTree
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else HERE,'geo.py')).read())
K=1.9  # world units per metre
HALF=44
def resample(P,step):
    Q=np.vstack([P,P[:1]]); d=np.hypot(*np.diff(Q,axis=0).T); s=np.r_[0,np.cumsum(d)]
    L=s[-1]; n=int(L//step); t=np.linspace(0,L,n,endpoint=False)
    return np.c_[np.interp(t,s,Q[:,0]),np.interp(t,s,Q[:,1])]
def tangents(P):
    T=np.roll(P,-1,0)-np.roll(P,1,0); return T/np.linalg.norm(T,axis=1)[:,None]
def curvR(P,k=2):
    a=np.roll(P,k,0);b=P;c=np.roll(P,-k,0)
    ab=np.hypot(*(b-a).T);bc=np.hypot(*(c-b).T);ca=np.hypot(*(a-c).T)
    cr=np.abs((b-a)[:,0]*(c-a)[:,1]-(b-a)[:,1]*(c-a)[:,0])
    return ab*bc*ca/(2*cr+1e-9)
def process(P,km,minsep=118,rmin=74,iters=500):
    L=np.sum(np.hypot(*np.diff(np.vstack([P,P[:1]]),axis=0).T))
    P=(P-P.mean(0))*(km*1000*K/L)
    P=resample(P,6.0); N=len(P)
    gap=int(2.2*minsep/6)
    for it in range(iters):
        T=tangents(P); Nrm=np.c_[-T[:,1],T[:,0]]
        tree=cKDTree(P); pairs=tree.query_pairs(minsep,output_type='ndarray')
        D=np.zeros_like(P); moved=0
        if len(pairs):
            i,j=pairs[:,0],pairs[:,1]
            g=np.abs(i-j); g=np.minimum(g,N-g); m=g>gap
            i,j=i[m],j[m]
            dot=np.abs(np.sum(T[i]*T[j],1)); m=dot>0.55; i,j=i[m],j[m]
            if len(i):
                v=P[i]-P[j]; d=np.hypot(*v.T)
                # project separation onto each point's normal
                dirn=v/np.maximum(d,1e-6)[:,None]
                push=((minsep-d)*0.25)[:,None]*dirn
                np.add.at(D,i,push); np.add.at(D,j,-push); moved=len(i)
                cnt=np.bincount(np.r_[i,j],minlength=len(P)).astype(float); D=D/np.maximum(cnt,1)[:,None]*2
        P=P+D
        # curvature limiting + mild laplacian everywhere moved
        R=np.minimum(curvR(P,2),curvR(P,4))
        w=np.clip((rmin-R)/rmin,0,1)*0.5
        w=np.maximum(w,np.convolve(np.r_[w[-4:],w,w[:4]],np.ones(9)/9,'same')[4:-4])
        avg=(np.roll(P,1,0)+np.roll(P,-1,0)+np.roll(P,2,0)+np.roll(P,-2,0))/4
        P=P+(avg-P)*w[:,None]
        if it%20==19: P=resample(P,6.0); N=len(P)
        if moved==0 and (np.minimum(curvR(P,2),curvR(P,4))>rmin*0.9).all() and it>10: break
    P=resample(P,6.0)
    # rescale to official length after smoothing shrinkage
    L2=np.sum(np.hypot(*np.diff(np.vstack([P,P[:1]]),axis=0).T)); P=P*(km*1000*K/L2)
    return P
def rdp_closed(P,eps):
    Q=np.vstack([P,P[:1]])
    keep=np.zeros(len(Q),bool);keep[0]=keep[-1]=True
    st=[(0,len(Q)-1)]
    while st:
        a,b=st.pop()
        if b-a<2: continue
        s,e=Q[a],Q[b];d=e-s;L=np.hypot(*d)
        seg=Q[a+1:b]
        dist=np.abs(d[0]*(seg[:,1]-s[1])-d[1]*(seg[:,0]-s[0]))/L if L>1e-6 else np.hypot(*(seg-s).T)
        k=dist.argmax()
        if dist[k]>eps: keep[a+1+k]=True; st+=[(a,a+1+k),(a+1+k,b)]
    return Q[keep][:-1]
