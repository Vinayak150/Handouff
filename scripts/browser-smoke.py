"""Optional Chromium browser regression against a local, built static directory.
Uses Playwright only as a test dependency on the operator machine. All API
responses are intercepted MOCKS: this script NEVER calls Sarvam.
"""
import asyncio, json, tempfile, subprocess, pathlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
ORIGIN="https://handoffguard.test"
async def main():
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--proxy-server=direct://','--proxy-bypass-list=*'])
            page=await browser.new_page(accept_downloads=True,viewport={'width':1280,'height':1000})
            errors=[];external=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.on('request',lambda r: external.append(r.url) if not r.url.startswith(ORIGIN) else None)
            # Serve browser assets as same-origin fixtures via Playwright routing.
            # No real network, no provider calls and no hosted Cloudflare behavior.
            async def serve_static(route):
                import mimetypes
                from urllib.parse import urlparse
                path=urlparse(route.request.url).path.lstrip('/') or 'index.html'
                if path not in {p.name for p in (ROOT/'dist').iterdir()}:
                    await route.fulfill(status=404,body='Not found');return
                asset=ROOT/'dist'/path
                mime=mimetypes.guess_type(path)[0] or 'text/plain'
                await route.fulfill(status=200,body=asset.read_bytes(),content_type=mime)
            await page.route('**/*',serve_static)
            await page.goto(ORIGIN,wait_until='networkidle')
            assert await page.title()=='HandoffGuard | Recovery Demo'
            await page.locator('#sample-blocked').click(); await page.locator('#analyze').click()
            blocked=await page.locator('#status').inner_text();assert '1 blocker(s)' in blocked and 'BLOCKED' in blocked,blocked
            assert await page.locator('#export').is_disabled()
            await page.locator('.finding').first.click()
            assert await page.locator('.sarvam-panel button').is_enabled()
            await page.screenshot(path=str(ROOT/'verification'/'browser-blocked.png'),full_page=True)
            await page.locator('#sample-reviewable').click();await page.locator('#analyze').click()
            status=await page.locator('#status').inner_text();assert '0 blocker(s)' in status and '1 review finding(s)' in status,status
            await page.locator('.finding').first.click()
            await page.locator('#review textarea').fill('Verified synthetic status change with original amount preserved')
            await page.locator('#review button').first.click()
            assert await page.locator('#export').is_enabled()
            # Intercept only the exact same-origin translation route.
            intercepted=[]
            async def mocked_response(route):
                req=route.request
                intercepted.append({'url':req.url,'body':req.post_data_json,'hasToken':len(req.headers.get('x-handoffguard-demo-token',''))==48})
                await route.fulfill(status=200,content_type='application/json',body=json.dumps({
                    'findingCode':'EDIT_REVIEW','targetLanguage':'mr-IN','sourceLanguage':'en-IN','model':'sarvam-translate:v1',
                    'translatedText':'<img src=x onerror=alert(1)> मार्गदर्शन केवळ माहितीकरिता आहे',
                    'englishTemplate':'Static approved advisory sentence','templateVersion':'2026-10-31.1','advisoryOnly':True
                }))
            await page.route('**/api/sarvam/translate',mocked_response)
            await page.locator('#handoffguard-sarvam-access').fill('t'*48)
            await page.locator('.sarvam-panel button').click()
            await page.wait_for_function("document.querySelector('.sarvam-panel [lang=mr]').textContent.includes('मार्गदर्शन')")
            assert await page.locator('#handoffguard-sarvam-access').input_value()==''
            assert await page.locator('.sarvam-panel img').count()==0
            assert intercepted==[{'url':ORIGIN+'/api/sarvam/translate','body':{'findingCode':'EDIT_REVIEW','targetLanguage':'mr-IN'},'hasToken':True}],intercepted
            await page.screenshot(path=str(ROOT/'verification'/'browser-reviewable-mock-marathi.png'),full_page=True)
            async with page.expect_download() as download_info: await page.locator('#export').click()
            download=await download_info.value
            with tempfile.TemporaryDirectory() as temp:
                path=pathlib.Path(temp)/'packet.json';await download.save_as(str(path))
                packet=json.loads(path.read_text());assert packet['advisoryTranslationIncluded'] is False
                assert 'translatedText' not in json.dumps(packet)
                cmd=['node','cli.cjs','verify','--original','fixtures/original.csv','--returned','fixtures/returned-reviewable.csv','--contract','fixtures/contract.json','--packet',str(path)]
                checked=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True)
                assert checked.returncode==0,(checked.stdout,checked.stderr)
            assert not errors,errors
            assert not external,external
            print(json.dumps({'status':'PASS','blocked':'PASS','reviewable':'PASS','mockMarathi':'PASS','translationDoesNotEnterPacket':True,'independentCliReplay':'PASS','externalRequests':external,'browserErrors':errors,'proofScreenshots':['verification/browser-blocked.png','verification/browser-reviewable-mock-marathi.png'],'provider':'MOCK NOT LIVE'},indent=2))
            await browser.close()
    finally:
        pass
if __name__=='__main__':asyncio.run(main())
