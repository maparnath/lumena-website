"""LUMENA live-site quality check. Fails (and GitHub emails the owner) if anything is broken."""
import sys, urllib.request, urllib.parse, ssl
from playwright.sync_api import sync_playwright
BASE = 'https://www.lumenahealthclinic.com/'
PAGES = ['index.html','about.html','approach.html','programs.html','services.html','contact.html','privacy.html','terms.html','disclaimer.html']
BOT_BLOCKING = ('nejm.org','google.com/maps')   # block automated checkers but work for people
problems = []
links = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (1300, 390, 320):
        pg = b.new_page(viewport={'width': w, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        bad = []; pg.on('response', lambda r: bad.append(f'{r.status} {r.url}') if r.status >= 400 and 'lumenahealthclinic' in r.url else None)
        for n in PAGES:
            try:
                resp = pg.goto(BASE + n, wait_until='networkidle', timeout=45000)
            except Exception as e:
                problems.append(f'{n}: did not load ({e})'); continue
            if not resp or resp.status != 200: problems.append(f'{n}: HTTP {resp.status if resp else "none"}')
            if 'Offline for a Rebuild' in pg.title(): problems.append(f'{n}: old holding page is showing')
            h = pg.evaluate('document.body.scrollHeight')
            for y in range(0, h, 700): pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(50)
            pg.wait_for_timeout(400)
            if pg.evaluate('document.documentElement.scrollWidth > innerWidth + 1'): problems.append(f'{n} @ {w}px: page scrolls sideways')
            br = pg.evaluate('[...document.images].filter(i=>i.complete&&i.naturalWidth==0).map(i=>i.src)')
            if br: problems.append(f'{n}: broken images {br}')
            for a in pg.evaluate('[...document.querySelectorAll("a[href]")].map(a=>a.getAttribute("href"))'):
                links.setdefault(a, set()).add(n)
        if errs: problems.append(f'@{w}px JavaScript errors: {sorted(set(errs))[:3]}')
        if bad: problems.append(f'@{w}px failed files: {sorted(set(bad))[:5]}')
        # contact chooser must open from every contact link and from the form
        pg.goto(BASE + 'contact.html', wait_until='networkidle')
        for i in range(pg.locator('a[href^="mailto:contact@"]').count()):
            pg.locator('a[href^="mailto:contact@"]').nth(i).click(); pg.wait_for_timeout(300)
            if not pg.is_visible('.cc-box'): problems.append(f'contact link #{i+1} @ {w}px: contact window did not open')
            else:
                g = pg.get_attribute('[data-cc="gmail"]', 'href') or ''
                if 'contact%40lumenahealthclinic.com' not in g or 'LUMENA%20NEW%20INQUIRY' not in g: problems.append('Gmail option has wrong address/subject')
            pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        pg.goto(BASE + 'index.html#book', wait_until='networkidle')
        pg.fill('#bookingForm [name=name]', 'QC Test'); pg.fill('#bookingForm [name=phone]', '5550000000')
        pg.click('#bookingForm button[type=submit]'); pg.wait_for_timeout(400)
        if not pg.is_visible('.cc-box'): problems.append(f'sign-up form @ {w}px: contact window did not open')
        # FAQ assistant
        pg.goto(BASE + 'index.html', wait_until='networkidle')
        pg.click('.chat-launcher'); pg.wait_for_timeout(300)
        if not pg.is_visible('.chat-panel'): problems.append(f'Common Questions @ {w}px did not open')
        n_q = pg.locator('.chat-q').count()
        if n_q < 5: problems.append(f'Common Questions @ {w}px shows only {n_q} questions')
        for i in range(n_q):
            pg.locator('.chat-q').nth(i).click(); pg.wait_for_timeout(350)
            a = pg.locator('.chat-a').nth(i); bx = a.bounding_box(); pb = pg.locator('.chat-body').bounding_box()
            if not (a.is_visible() and bx and pb and pb['y'] - 1 <= bx['y'] < pb['y'] + pb['height'] and len(a.inner_text().strip()) > 20):
                problems.append(f'Common Questions @ {w}px: answer #{i+1} not visible')
        pg.fill('.chat-input', 'do you take insurance'); pg.press('.chat-input', 'Enter'); pg.wait_for_timeout(300)
        if pg.locator('.chat-qa.is-open').count() != 1: problems.append(f'Common Questions @ {w}px: typed question gave no answer')
        # theme toggle
        t = pg.query_selector('[data-theme-toggle],[aria-label*="theme" i],[aria-label*="dark" i]')
        if t:
            pg.keyboard.press('Escape'); b4 = pg.evaluate('document.documentElement.getAttribute("data-theme")')
            pg.goto(BASE + 'index.html'); t = pg.query_selector('[data-theme-toggle],[aria-label*="theme" i],[aria-label*="dark" i]'); t.click(); pg.wait_for_timeout(200)
            if pg.evaluate('document.documentElement.getAttribute("data-theme")') == b4: problems.append('light/dark toggle does nothing')
        if w < 500:
            pg.goto(BASE + 'index.html'); m = pg.query_selector('[aria-label*="menu" i],.nav-toggle,.menu-toggle')
            if not m: problems.append('phone menu button missing')
            else:
                m.click(); pg.wait_for_timeout(400)
                if pg.evaluate('[...document.querySelectorAll("nav a")].filter(a=>a.offsetParent!==null).length') < 3: problems.append('phone menu does not open')
    b.close()
ctx = ssl.create_default_context()
for href, src in sorted(links.items()):
    if href.startswith(('mailto:', 'tel:', '#')): continue
    u = urllib.parse.urljoin(BASE, href.split('#')[0])
    if any(x in u for x in BOT_BLOCKING): continue
    try: code = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20, context=ctx).status
    except urllib.error.HTTPError as e: code = e.code
    except Exception as e: code = str(e)[:60]
    if code != 200: problems.append(f'broken link {href} (on {sorted(src)[:2]}): {code}')
if problems:
    print('LUMENA SITE CHECK FAILED'); [print(' -', x) for x in problems]; sys.exit(1)
print('LUMENA site check passed: all pages, links, contact window, sign-up form, FAQ, menus OK.')
