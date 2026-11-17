#!/usr/bin/env python3
"""Serve the game over HTTPS, for testing on a phone.

Phones only give motion sensors (tilt steering), service workers (install, offline) and
WebRTC full features to secure pages, so plain `python -m http.server` is not enough.

    python tools/serve.py              # https://<your LAN address>:8443/vector-gp.html
    python tools/serve.py --port 9000
    python tools/serve.py --ip 192.168.1.50      # add an address to the certificate
    python tools/serve.py --cert my.pem --key my-key.pem   # your own certificate

The certificate is made on first run in .certs/ (ignored by git) and made again if the
machine's addresses change. With `mkcert` installed (https://github.com/FiloSottile/mkcert)
it is a locally trusted one; otherwise `openssl` makes a self-signed one, which the phone
warns about once (see the README for what to tap, and for trusting an mkcert root on an iPhone).
Needs Python 3.8+ and either mkcert or openssl.
"""
import argparse, functools, http.server, os, shutil, socket, ssl, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CERTS = os.path.join(ROOT, '.certs')


def lan_ips(extra):
    ips = set(extra)
    try:                                   # the address used to reach the outside world (nothing is sent)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('10.255.255.255', 1)); ips.add(s.getsockname()[0]); s.close()
    except OSError:
        pass
    try:
        ips.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        pass
    for cmd in (['hostname', '-I'], ['ifconfig']):     # every interface address (Linux, macOS)
        try:
            out = subprocess.run(cmd, capture_output=True, text=True, timeout=3).stdout
        except (OSError, subprocess.SubprocessError):
            continue
        toks = out.split()
        ips.update(t for i, t in enumerate(toks) if (cmd[0] == 'hostname' or (i and toks[i - 1] == 'inet')) and t.count('.') == 3 and t.replace('.', '').isdigit())
        break
    return sorted(i for i in ips if i and not i.startswith('127.') and not i.startswith('169.254.'))


def make_cert(cert, key, names):
    os.makedirs(CERTS, exist_ok=True)
    dns = ['localhost'] + [n for n in names if not n[0].isdigit()]
    ips = ['127.0.0.1', '::1'] + [n for n in names if n[0].isdigit()]
    if shutil.which('mkcert'):
        subprocess.run(['mkcert', '-cert-file', cert, '-key-file', key] + dns + ips, check=True)
        return 'mkcert'
    if shutil.which('openssl'):
        san = ','.join(['DNS:' + d for d in dns] + ['IP:' + i for i in ips])
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '365', '-keyout', key, '-out', cert,
                        '-subj', '/CN=VECTOR GP dev', '-addext', 'subjectAltName=' + san], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return 'openssl (self-signed)'
    sys.exit('Need mkcert or openssl to make a certificate (or pass --cert and --key).')


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):                 # always serve the latest files while developing
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '--quiet' not in sys.argv:
            super().log_message(fmt, *args)


def main():
    ap = argparse.ArgumentParser(description='Serve VECTOR GP over HTTPS.')
    ap.add_argument('--port', type=int, default=8443)
    ap.add_argument('--host', default='0.0.0.0', help='interface to listen on (default: all)')
    ap.add_argument('--ip', action='append', default=[], help='extra address or name for the certificate')
    ap.add_argument('--cert'); ap.add_argument('--key')
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()

    names = lan_ips(a.ip) + [n for n in a.ip if not n[0].isdigit()]
    names = sorted(set(names))
    cert, key, how = a.cert, a.key, 'your certificate'
    if not (cert and key):
        cert, key = os.path.join(CERTS, 'cert.pem'), os.path.join(CERTS, 'key.pem')
        sans = os.path.join(CERTS, 'names.txt')
        have = open(sans).read().split() if os.path.exists(sans) else None
        if have != names or not (os.path.exists(cert) and os.path.exists(key)):
            how = make_cert(cert, key, names)
            open(sans, 'w').write('\n'.join(names))
        else:
            how = 'certificate from .certs/ (delete the folder to make a new one)'
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(cert, key)
    handler = functools.partial(Handler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer((a.host, a.port), handler)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    print(f'VECTOR GP over HTTPS ({how})', flush=True)
    print(f'  this computer : https://localhost:{a.port}/vector-gp.html')
    for ip in [n for n in names if n[0].isdigit()]:
        print(f'  on your network: https://{ip}:{a.port}/vector-gp.html', flush=True)
    print('Ctrl+C to stop.', flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print()


if __name__ == '__main__':
    main()
