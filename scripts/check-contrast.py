# WCAG contrast check for the theme tokens in globals.css (light and dark).
# Usage: python scripts/check-contrast.py src/app/globals.css
import re,sys,math
css=open(sys.argv[1],encoding='utf-8').read()
def block(name):
    m=re.search(re.escape(name)+r'\s*\{(.*?)\n\}',css,re.S); return dict(re.findall(r'--([\w-]+):\s*([^;]+);',m.group(1)))
def oklch2rgb(s):
    m=re.match(r'oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: / (\d+)%)?\)',s.strip()); L,C,H=map(float,m.groups()[:3]); a=(int(m.group(4))/100) if m.group(4) else 1
    h=math.radians(H); A=C*math.cos(h); B=C*math.sin(h)
    l=(L+0.3963377774*A+0.2158037573*B)**3; mm=(L-0.1055613458*A-0.0638541728*B)**3; s_=(L-0.0894841775*A-1.2914855480*B)**3
    r=4.0767416621*l-3.3077115913*mm+0.2309699292*s_; g=-1.2684380046*l+2.6097574011*mm-0.3413193965*s_; b=-0.0041960863*l-0.7034186147*mm+1.7076147010*s_
    return [min(1,max(0,x)) for x in (r,g,b)],a
def lum(c): return sum(w*x for w,x in zip((0.2126,0.7152,0.0722),c))
def mix(fg,a,bg): return [f*a+b*(1-a) for f,b in zip(fg,bg)]
def ratio(f,b):
    L1,L2=sorted([lum(f)+0.05,lum(b)+0.05]); return L2/L1
pairs=[('foreground','background'),('muted-foreground','background'),('muted-foreground','card'),('muted-foreground','muted'),('primary-foreground','primary'),('primary','background'),('destructive','background'),('success','card'),('warning','card'),('info','card'),('destructive','card'),('sidebar-foreground','sidebar'),('muted-foreground','sidebar'),('ring','background')]
for mode in (':root','.dark'):
    t=block(mode); print(mode)
    for f,b in pairs:
        bg,_=oklch2rgb(t[b]); fg,a=oklch2rgb(t[f]); r=ratio(mix(fg,a,bg),bg)
        need=3 if f=='ring' else 4.5
        # status text sits on a 10% tint of itself
        if f in('success','warning','info','destructive') and b=='card': bg=mix(fg,0.1,bg); r=ratio(fg,bg)
        print(f'  {f:20} on {b:12} {r:5.2f} {"OK" if r>=need else "FAIL"}')
