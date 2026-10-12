"""Prepare Maven for the current environment's supported HTTPS proxy."""
import os
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree.ElementTree import Element,SubElement,ElementTree
root=Path(__file__).resolve().parent.parent
(root/'.local').mkdir(exist_ok=True)
settings=Element('settings',xmlns='http://maven.apache.org/SETTINGS/1.2.0')
url=os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
if url:
 p=urlsplit(url)
 if p.username or p.password: raise SystemExit('Use an externally managed Maven settings file for an authenticated proxy.')
 proxy=SubElement(SubElement(settings,'proxies'),'proxy')
 for key,value in {'id':'environment','active':'true','protocol':'http','host':p.hostname,'port':str(p.port or 80),'nonProxyHosts':'localhost|127.0.0.1'}.items():SubElement(proxy,key).text=value
path=root/'.local/maven-settings.xml';ElementTree(settings).write(path,encoding='utf-8',xml_declaration=True);path.chmod(0o600)
print('Maven proxy configuration prepared without printing values.')
