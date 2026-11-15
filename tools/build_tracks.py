"""Rebuild the TRACKS table inside vector-gp.html from the bacinger/f1-circuits GeoJSON files.

Usage:  python tools/build_tracks.py PATH_TO_f1-circuits
        (clone https://github.com/bacinger/f1-circuits first)
Needs numpy and scipy.
"""
import json,sys,os,re,numpy as np
HERE=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE,'prep.py')).read())
if len(sys.argv)<2: sys.exit(__doc__)
DATA=os.path.join(sys.argv[1],'circuits')
CUR=[ # id, file, gp, circuit, city, km, date, cancelled, reverse
('AUS','au-1953','Australian GP','Albert Park','Melbourne',5.278,'8 Mar',0,0),
('CHN','cn-2004','Chinese GP','Shanghai International Circuit','Shanghai',5.451,'15 Mar',0,0),
('JPN','jp-1962','Japanese GP','Suzuka','Suzuka',5.807,'29 Mar',0,0),
('BHR','bh-2002','Bahrain GP','Bahrain International Circuit','Sakhir',5.412,'12 Apr',1,0),
('SAU','sa-2021','Saudi Arabian GP','Jeddah Corniche Circuit','Jeddah',6.174,'19 Apr',1,0),
('MIA','us-2022','Miami GP','Miami International Autodrome','Miami',5.412,'3 May',0,0),
('CAN','ca-1978','Canadian GP','Circuit Gilles Villeneuve','Montreal',4.361,'24 May',0,0),
('MON','mc-1929','Monaco GP','Circuit de Monaco','Monte Carlo',3.337,'7 Jun',0,0),
('ESP','es-1991','Barcelona-Catalunya GP','Circuit de Barcelona-Catalunya','Montmeló',4.657,'14 Jun',0,0),
('AUT','at-1969','Austrian GP','Red Bull Ring','Spielberg',4.318,'28 Jun',0,0),
('GBR','gb-1948','British GP','Silverstone','Silverstone',5.891,'5 Jul',0,0),
('BEL','be-1925','Belgian GP','Spa-Francorchamps','Stavelot',7.004,'19 Jul',0,0),
('HUN','hu-1986','Hungarian GP','Hungaroring','Budapest',4.381,'26 Jul',0,0),
('NED','nl-1948','Dutch GP','Zandvoort','Zandvoort',4.259,'23 Aug',0,0),
('ITA','it-1922','Italian GP','Monza','Monza',5.793,'6 Sep',0,0),
('MAD','es-2026','Spanish GP','Madring','Madrid',5.474,'13 Sep',0,0),
('AZE','az-2016','Azerbaijan GP','Baku City Circuit','Baku',6.003,'26 Sep',0,0),
('SGP','sg-2008','Singapore GP','Marina Bay','Singapore',4.940,'11 Oct',0,1),
('USA','us-2012','United States GP','Circuit of the Americas','Austin',5.513,'25 Oct',0,0),
('MEX','mx-1962','Mexico City GP','Autódromo Hermanos Rodríguez','Mexico City',4.304,'1 Nov',0,0),
('BRA','br-1940','São Paulo GP','Interlagos','São Paulo',4.309,'8 Nov',0,0),
('LVS','us-2023','Las Vegas GP','Las Vegas Strip Circuit','Las Vegas',6.201,'21 Nov',0,0),
('QAT','qa-2004','Qatar GP','Lusail International Circuit','Lusail',5.419,'29 Nov',0,0),
('ABU','ae-2009','Abu Dhabi GP','Yas Marina','Abu Dhabi',5.281,'6 Dec',0,0)]
PAST=[
('IMO','it-1953','San Marino / Emilia Romagna GP','Imola','Imola',4.909,'1980–2006, 2020–25',0,0),
('MAL','my-1999','Malaysian GP','Sepang','Sepang',5.543,'1999–2017',0,0),
('TUR','tr-2005','Turkish GP','Istanbul Park','Istanbul',5.338,'2005–11, 2020–21',0,0),
('GER','de-1932','German GP','Hockenheimring','Hockenheim',4.574,'2002–2019 layout',0,0),
('EUR','de-1927','European / Eifel GP','Nürburgring GP','Nürburg',5.148,'1984–2020',0,0),
('FRA','fr-1960','French GP','Magny-Cours','Magny-Cours',4.411,'1991–2008',0,0),
('PRI','fr-1969','French GP','Paul Ricard','Le Castellet',5.842,'2018–2022',0,1),
('POR','pt-1972','Portuguese GP','Estoril','Estoril',4.349,'1984–1996',0,0),
('ALG','pt-2008','Portuguese GP','Portimão','Portimão',4.653,'2020–2021',0,0),
('TUS','it-1914','Tuscan GP','Mugello','Scarperia',5.245,'2020',0,0),
('RUS','ru-2014','Russian GP','Sochi Autodrom','Sochi',5.848,'2014–2021',0,0),
('IND','us-1909','United States GP','Indianapolis road course','Indianapolis',4.192,'2000–2007',0,0),
('WGI','us-1956','United States GP','Watkins Glen','Watkins Glen',5.430,'1961–1980',0,0),
('RSA','za-1961','South African GP','Kyalami (current layout)','Midrand',4.529,'1967–85, 1992–93',0,0),
('BRJ','br-1977','Brazilian GP','Jacarepaguá','Rio de Janeiro',5.031,'1978, 1981–1989',0,0),
('ARG','ar-1952','Argentine GP','Autódromo Oscar y Juan Gálvez','Buenos Aires',4.322,'1953–1998',0,0)]
out=[];stats={}
for grp,L in (('2026',CUR),('PAST',PAST)):
    for (id,f,gp,c,city,km,date,canc,rev) in L:
        p,xy=load(os.path.join(DATA,f+'.geojson'))
        if rev: xy=np.vstack([xy[:1],xy[:0:-1]])
        P=process(xy,km,minsep=70 if id=='PRI' else 118)
        S=rdp_closed(P,1.2)
        out.append(dict(id=id,grp=grp,gp=gp,c=c,city=city,km=km,date=date,canc=canc,p=[[int(round(x)),int(round(y))] for x,y in S]))
        stats[id]=(len(xy),len(S))
        print(id,len(xy),'->',len(S),flush=True)
q=lambda s:s.replace("\\","\\\\").replace("'","\\'")
lines=[];r=0
for t in out:
    if t['grp']=='2026': r+=1
    lines.append("{id:'%s',g:'%s',r:%d,gp:'%s',c:'%s',city:'%s',km:%s,date:'%s',canc:%d,p:%s}"%(t['id'],t['grp'],r if t['grp']=='2026' else 0,q(t['gp']),q(t['c']),q(t['city']),t['km'],q(t['date']),t['canc'],json.dumps(t['p'],separators=(',',':'))))
block=("/* Circuit geometry derived from bacinger/f1-circuits (https://github.com/bacinger/f1-circuits)\n"
       "   Copyright (c) 2019-2025 Tomislav Bacinger, MIT License. Smoothed and widened for gameplay. */\n"
       "const TRACKS=[\n"+',\n'.join(lines)+'\n];\n')
html_path=os.path.join(HERE,'..','vector-gp.html')
h=open(html_path,encoding='utf-8').read()
a=h.index('/* Circuit geometry derived'); b=h.index('\n];\n',a)+4
open(html_path,'w',encoding='utf-8').write(h[:a]+block+h[b:])
print('TRACKS updated in vector-gp.html:',len(out),'circuits')
