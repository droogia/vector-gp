import json,glob,math,numpy as np
def load(f):
    d=json.load(open(f));ft=d['features'][0];p=ft['properties'];c=np.array(ft['geometry']['coordinates'],float)
    if np.allclose(c[0],c[-1]): c=c[:-1]
    lat0=c[:,1].mean()
    xy=np.c_[c[:,0]*math.cos(math.radians(lat0))*111320, -c[:,1]*110540]
    return p,xy
