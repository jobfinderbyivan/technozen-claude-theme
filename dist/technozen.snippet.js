(() => {
  const THEMES = {"shiro": {"name": "Shiro Ceramic", "mode": "light", "accent": "#1E7FD3", "bg": "#FFFFFF"}, "take": {"name": "Take Karesansui", "mode": "light", "accent": "#3A8236", "bg": "#F2F1E6"}, "sakura": {"name": "Sakura Mokuzai", "mode": "light", "accent": "#BC4E68", "bg": "#FCEFEF"}, "mizu": {"name": "Mizu Glass", "mode": "dark", "accent": "#2ED3C4", "bg": "#0B2A3F"}, "yoru": {"name": "Yoru Lantern", "mode": "dark", "accent": "#F2B35B", "bg": "#16181D"}};
  const ORDER = Object.keys(THEMES);
  const CSS = {"shiro": "html[data-technozen=\"shiro\"],html[data-technozen=\"shiro\"] *{color-scheme: light !important;--cds-page-bg: #FFFFFF !important;--cds-surface-1: #FFFFFF !important;--cds-surface-2: #FFFFFF !important;--cds-fill-field: #FFFFFF !important;--cds-surface-0: #F3F5F7 !important;--cds-surface-3: #F3F5F7 !important;--cds-surface-panel: #F3F5F7 !important;--cds-surface-popover: #F3F5F7 !important;--cds-fizzy-lake-color-sidebar: #F3F5F7 !important;--cds-fizzy-lake-color-card-hover: #CFEAF780 !important;--df-bg-page: #FFFFFF !important;--df-sidebar-bg: #F3F5F7 !important;--df-web-sidebar-bg: #F3F5F7 !important;--df-sidebar-tint: #F3F5F7 !important;--surface-panel: #F3F5F7 !important;--surface-popover: #F3F5F7 !important;--cds-text-primary: #2B2F33 !important;--cds-text-secondary: #646B72 !important;--cds-text-muted: #646B72 !important;--cds-text-stays-secondary: #646B72 !important;--cds-tooltip-bg: #2B2F33 !important;--cds-fill-primary: #2B2F33 !important;--cds-fill-primary-hover: #646B72 !important;--cds-on-primary: #FFFFFF !important;--cds-alpha-1: #2B2F330D !important;--cds-alpha-2: #2B2F331A !important;--cds-alpha-3: #2B2F3333 !important;--cds-backdrop: #2B2F3373 !important;--cds-border: #DDE2E6 !important;--cds-border-line: #DDE2E6 !important;--cds-fizzy-lake-color-seam: #DDE2E6 !important;--cds-fizzy-lake-color-composer-ring: #DDE2E6 !important;--cds-ring-color: #DDE2E6 !important;--cds-border-strong: #646B7266 !important;--cds-border-stronger: #646B7299 !important;--cds-role-accent-400: #1E7FD3 !important;--cds-role-accent-450: #1E7FD3 !important;--cds-role-accent-600: #216BAB !important;--cds-fill-accent: #1E7FD3 !important;--cds-fill-accent-hover: #2073BB !important;--cds-text-accent: #216BAB !important;--cds-role-accent-on: #111111 !important;--cds-on-accent: #111111 !important;--cds-border-accent: #1E7FD359 !important;--cds-bg-accent: #1E7FD324 !important;--cds-bg-accent-muted: #1E7FD31A !important;--cds-bg-accent-chip: #1E7FD324 !important;--cds-bg-accent-layer: #1E7FD312 !important;--cds-clay: #1E7FD3 !important;--cds-clay-emphasized: #2073BB !important;--cds-bg-user-message: #AEB6BD38 !important;--cds-fill-pro: #AEB6BD !important;--cds-bg-pro: #AEB6BD24 !important;--cds-bg-highlight: #CFEAF78C !important;--cds-fill-ghost-hover: #CFEAF773 !important;--cds-fill-ghost-selected: #CFEAF7BF !important;--cds-fill-secondary: #CFEAF759 !important;--cds-fill-secondary-hover: #CFEAF78C !important;--cds-fill-button-ghost-hover: #CFEAF78C !important;--cds-bg-neutral: #CFEAF759 !important;--cds-bg-neutral-hover: #CFEAF78C !important;--cds-fizzy-lake-color-selected-hover: #CFEAF7CC !important;--df-hover: #CFEAF773 !important;--df-selected: #CFEAF7BF !important;--df-selected-base: #CFEAF7 !important;--cds-neutral-0: #FFFFFF !important;--cds-neutral-10: #FDFDFD !important;--cds-neutral-20: #FAFAFA !important;--cds-neutral-30: #F8F8F8 !important;--cds-neutral-40: #F6F6F6 !important;--cds-neutral-50: #F3F3F4 !important;--cds-neutral-60: #F1F1F1 !important;--cds-neutral-70: #EFEFEF !important;--cds-neutral-80: #ECEDED !important;--cds-neutral-90: #EAEAEB !important;--cds-neutral-100: #E7E8E8 !important;--cds-neutral-150: #DCDCDD !important;--cds-neutral-200: #D0D1D2 !important;--cds-neutral-250: #C4C5C6 !important;--cds-neutral-300: #B8BABB !important;--cds-neutral-400: #A1A3A4 !important;--cds-neutral-500: #898B8E !important;--cds-neutral-600: #727477 !important;--cds-neutral-700: #5A5D60 !important;--cds-neutral-800: #43464A !important;--cds-neutral-850: #373B3E !important;--cds-neutral-900: #2B2F33 !important;--bg-000: 210.0 20.0% 96.1% !important;--bg-200: 210.0 20.0% 96.1% !important;--bg-300: 210.0 20.0% 96.1% !important;--bg-400: 206.7 15.3% 88.4% !important;--text-000: 210.0 8.5% 18.4% !important;--text-100: 210.0 8.5% 18.4% !important;--text-200: 210.0 8.5% 18.4% !important;--text-300: 210.0 6.5% 42.0% !important;--text-400: 210.0 6.5% 42.0% !important;--text-500: 210.0 6.5% 42.0% !important;--border-100: 210.0 6.5% 42.0% !important;--border-300: 210.0 6.5% 42.0% !important;--brand-000: 207.8 75.1% 47.3% !important;--brand-100: 207.8 75.1% 47.3% !important;--brand-200: 207.8 75.1% 47.3% !important;--accent-000: 207.8 67.6% 40.0% !important;--accent-100: 207.8 75.1% 47.3% !important;--oncolor-100: 0.0 0.0% 6.7% !important;--pictogram-100: 206.7 15.3% 88.4% !important;--df-z0: 0.0 0.0% 100.0% !important;--df-z1: 210.0 20.0% 96.1% !important;--df-z2: 210.0 20.0% 96.1% !important;--df-z4: 206.7 15.3% 88.4% !important;--df-bg-page-hsl: 0.0 0.0% 100.0% !important;}\nhtml[data-technozen=\"shiro\"][data-technozen-skin=\"on\"] {\n&,& *{--df-bg-page: transparent !important;--cds-surface-0: rgba(255,255,255,0.78) !important;--cds-surface-3: #ffffff !important;--cds-fizzy-lake-color-sidebar: #f1f4f7 !important;--df-sidebar-bg: #f1f4f7 !important;--df-web-sidebar-bg: #f1f4f7 !important;--cds-fill-primary: #2f8fe0 !important;--cds-fill-primary-hover: #3a97e8 !important;--cds-on-primary: #ffffff !important;}&{background: radial-gradient(55vw 40vh at 85% 0%,rgba(207,234,247,0.6),transparent 70%),linear-gradient(180deg,#ffffff 0%,#f3f5f7 100%) fixed !important;}.bg-surface-1,.bg-surface-2,.dframe-root,.dframe-content,.dframe-pane,main{background-color: transparent !important;}nav,aside,.dframe-sidebar{background: linear-gradient(90deg,#f3f5f7,#edf0f3) !important;box-shadow: inset -1px 0 0 #ffffff,inset 0 1px 0 #ffffff;}[data-cds=\"Panel\"],[data-cds=\"Card\"]>.cds-card-fill,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"Popover\"],[data-cds=\"Menu\"]{border-radius: 18px;border: 1px solid #dde2e6;box-shadow: inset 0 1px 0 #ffffff,0 10px 28px rgba(43,47,51,0.08);}[data-cds=\"Button\"]{border-radius: 999px !important;border: 0 !important;box-shadow: inset 0 1px 0 rgba(255,255,255,0.9),0 0 0 1px rgba(43,47,51,0.08),0 4px 12px rgba(43,47,51,0.08) !important;transition: filter 0.15s,box-shadow 0.15s,transform 0.1s;}[data-cds=\"Button\"]>[data-cds-part=\"paint\"]::before,[data-cds=\"Button\"]>.cds-btn-squish::before{content: \"\";position: absolute;inset: 0 0 50% 0;border-radius: inherit;background: linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.1));pointer-events: none;}[data-cds=\"Button\"]:hover{filter: brightness(1.05);box-shadow: inset 0 1px 0 rgba(255,255,255,0.9),0 0 0 4px #cfeaf7,0 4px 12px rgba(43,47,51,0.1) !important;}[data-cds=\"Button\"]:active{transform: translateY(1px);box-shadow: inset 0 2px 4px rgba(0,0,0,0.18) !important;}[data-cds=\"ChatComposer\"],.ProseMirror{border-radius: 18px !important;box-shadow: 0 -2px 0 0 #cfeaf7,0 0 18px rgba(207,234,247,0.9),inset 0 1px 0 #ffffff !important;}h1,h2{font-weight: 500 !important;}\n}\n", "take": "html[data-technozen=\"take\"],html[data-technozen=\"take\"] *{color-scheme: light !important;--cds-page-bg: #F2F1E6 !important;--cds-surface-1: #F2F1E6 !important;--cds-surface-2: #F2F1E6 !important;--cds-fill-field: #F2F1E6 !important;--cds-surface-0: #FBFAF3 !important;--cds-surface-3: #FBFAF3 !important;--cds-surface-panel: #FBFAF3 !important;--cds-surface-popover: #FBFAF3 !important;--cds-fizzy-lake-color-sidebar: #FBFAF3 !important;--cds-fizzy-lake-color-card-hover: #B9E0B080 !important;--df-bg-page: #F2F1E6 !important;--df-sidebar-bg: #FBFAF3 !important;--df-web-sidebar-bg: #FBFAF3 !important;--df-sidebar-tint: #FBFAF3 !important;--surface-panel: #FBFAF3 !important;--surface-popover: #FBFAF3 !important;--cds-text-primary: #2E3A33 !important;--cds-text-secondary: #5E6B5A !important;--cds-text-muted: #5E6B5A !important;--cds-text-stays-secondary: #5E6B5A !important;--cds-tooltip-bg: #2E3A33 !important;--cds-fill-primary: #2E3A33 !important;--cds-fill-primary-hover: #5E6B5A !important;--cds-on-primary: #F2F1E6 !important;--cds-alpha-1: #2E3A330D !important;--cds-alpha-2: #2E3A331A !important;--cds-alpha-3: #2E3A3333 !important;--cds-backdrop: #2E3A3373 !important;--cds-border: #D3D6C8 !important;--cds-border-line: #D3D6C8 !important;--cds-fizzy-lake-color-seam: #D3D6C8 !important;--cds-fizzy-lake-color-composer-ring: #D3D6C8 !important;--cds-ring-color: #D3D6C8 !important;--cds-border-strong: #5E6B5A66 !important;--cds-border-stronger: #5E6B5A99 !important;--cds-role-accent-400: #3A8236 !important;--cds-role-accent-450: #3A8236 !important;--cds-role-accent-600: #377035 !important;--cds-fill-accent: #3A8236 !important;--cds-fill-accent-hover: #387736 !important;--cds-text-accent: #377035 !important;--cds-role-accent-on: #FFFFFF !important;--cds-on-accent: #FFFFFF !important;--cds-border-accent: #3A823659 !important;--cds-bg-accent: #3A823624 !important;--cds-bg-accent-muted: #3A82361A !important;--cds-bg-accent-chip: #3A823624 !important;--cds-bg-accent-layer: #3A823612 !important;--cds-clay: #3A8236 !important;--cds-clay-emphasized: #387736 !important;--cds-bg-user-message: #B8A98A38 !important;--cds-fill-pro: #B8A98A !important;--cds-bg-pro: #B8A98A24 !important;--cds-bg-highlight: #B9E0B08C !important;--cds-fill-ghost-hover: #B9E0B073 !important;--cds-fill-ghost-selected: #B9E0B0BF !important;--cds-fill-secondary: #B9E0B059 !important;--cds-fill-secondary-hover: #B9E0B08C !important;--cds-fill-button-ghost-hover: #B9E0B08C !important;--cds-bg-neutral: #B9E0B059 !important;--cds-bg-neutral-hover: #B9E0B08C !important;--cds-fizzy-lake-color-selected-hover: #B9E0B0CC !important;--df-hover: #B9E0B073 !important;--df-selected: #B9E0B0BF !important;--df-selected-base: #B9E0B0 !important;--cds-neutral-0: #F2F1E6 !important;--cds-neutral-10: #F0EFE4 !important;--cds-neutral-20: #EEEDE2 !important;--cds-neutral-30: #EBEBE0 !important;--cds-neutral-40: #E9E9DE !important;--cds-neutral-50: #E7E7DC !important;--cds-neutral-60: #E5E5DA !important;--cds-neutral-70: #E3E3D8 !important;--cds-neutral-80: #E1E1D6 !important;--cds-neutral-90: #DEDFD4 !important;--cds-neutral-100: #DCDDD2 !important;--cds-neutral-150: #D1D2C8 !important;--cds-neutral-200: #C6C8BE !important;--cds-neutral-250: #BCBEB4 !important;--cds-neutral-300: #B1B4AA !important;--cds-neutral-400: #9BA096 !important;--cds-neutral-500: #858B83 !important;--cds-neutral-600: #6F776F !important;--cds-neutral-700: #5A635B !important;--cds-neutral-800: #444E47 !important;--cds-neutral-850: #39443D !important;--cds-neutral-900: #2E3A33 !important;--bg-000: 52.5 50.0% 96.9% !important;--bg-200: 52.5 50.0% 96.9% !important;--bg-300: 52.5 50.0% 96.9% !important;--bg-400: 72.9 14.6% 81.2% !important;--text-000: 145.0 11.5% 20.4% !important;--text-100: 145.0 11.5% 20.4% !important;--text-200: 145.0 11.5% 20.4% !important;--text-300: 105.9 8.6% 38.6% !important;--text-400: 105.9 8.6% 38.6% !important;--text-500: 105.9 8.6% 38.6% !important;--border-100: 105.9 8.6% 38.6% !important;--border-300: 105.9 8.6% 38.6% !important;--brand-000: 116.8 41.3% 36.1% !important;--brand-100: 116.8 41.3% 36.1% !important;--brand-200: 116.8 41.3% 36.1% !important;--accent-000: 118.0 35.8% 32.4% !important;--accent-100: 116.8 41.3% 36.1% !important;--oncolor-100: 0.0 0.0% 100.0% !important;--pictogram-100: 72.9 14.6% 81.2% !important;--df-z0: 55.0 31.6% 92.5% !important;--df-z1: 52.5 50.0% 96.9% !important;--df-z2: 52.5 50.0% 96.9% !important;--df-z4: 72.9 14.6% 81.2% !important;--df-bg-page-hsl: 55.0 31.6% 92.5% !important;}\nhtml[data-technozen=\"take\"][data-technozen-skin=\"on\"] {\n&,& *{--df-bg-page: transparent !important;--cds-page-bg: transparent !important;--cds-surface-1: transparent !important;--cds-surface-2: transparent !important;--cds-neutral-0: transparent !important;--cds-fizzy-lake-color-sidebar: rgba(255,255,255,0.42) !important;--df-sidebar-bg: rgba(255,255,255,0.42) !important;--df-web-sidebar-bg: rgba(255,255,255,0.42) !important;--cds-surface-0: rgba(255,255,255,0.55) !important;--cds-surface-3: rgba(255,255,255,0.72) !important;--cds-surface-panel: rgba(255,255,255,0.72) !important;--cds-surface-popover: rgba(255,255,255,0.82) !important;--cds-fill-field: rgba(255,255,255,0.6) !important;--cds-bg-user-message: rgba(255,255,255,0.55) !important;--cds-message-bubble-radius: 26px !important;--msg-block-radius: 16px !important;--cds-radius-composer: 24px !important;--cds-fill-primary: rgba(255,255,255,0.4) !important;--cds-on-primary: #263028 !important;--cds-fill-primary-hover: rgba(255,255,255,0.6) !important;--cds-border: rgba(255,255,255,0.6) !important;--cds-border-line: rgba(255,255,255,0.6) !important;--cds-text-primary: #263028 !important;--cds-text-secondary: #34433a !important;--cds-text-muted: #34433a !important;}&{background: #7fd130 url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='leaf' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23c4f24e'/><stop offset='.45' stop-color='%2384d431'/><stop offset='1' stop-color='%232f8f1c'/></linearGradient><filter id='cells' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='.02 .035' numOctaves='2' seed='7'/><feColorMatrix type='matrix' values='0 0 0 0 .55  0 0 0 0 .95  0 0 0 0 .25  0 0 0 .2 0'/></filter><pattern id='tile' width='400' height='400' patternUnits='userSpaceOnUse'><rect width='400' height='400' filter='url(%23cells)'/></pattern><radialGradient id='body' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23fff' stop-opacity='.04'/><stop offset='.62' stop-color='%23eaffc8' stop-opacity='.1'/><stop offset='.86' stop-color='%233f9a28' stop-opacity='.22'/><stop offset='1' stop-color='%230d4a12' stop-opacity='.55'/></radialGradient><linearGradient id='rim' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23fff' stop-opacity='.75'/><stop offset='.45' stop-color='%234caa2c' stop-opacity='.2'/><stop offset='1' stop-color='%230b3d0f' stop-opacity='.8'/></linearGradient><radialGradient id='shadow' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23063a0a' stop-opacity='.38'/><stop offset='.6' stop-color='%23063a0a' stop-opacity='.18'/><stop offset='1' stop-color='%23063a0a' stop-opacity='0'/></radialGradient><radialGradient id='highlight' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23fff' stop-opacity='.9'/><stop offset='.55' stop-color='%23fff' stop-opacity='.45'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></radialGradient><radialGradient id='caustic' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23fff' stop-opacity='.4'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></radialGradient><g id='d'><ellipse rx='1.1' ry='.7' cx='.3' cy='.65' fill='url(%23shadow)'/><ellipse rx='1' ry='1' fill='url(%23body)'/><ellipse rx='1' ry='1' fill='none' stroke='url(%23rim)'/><ellipse rx='.5' ry='.2' cx='.05' cy='.62' fill='url(%23caustic)'/><ellipse rx='.42' ry='.3' cx='-.3' cy='-.4' fill='url(%23highlight)'/><ellipse rx='.13' ry='.08' cx='-.36' cy='-.5' fill='%23fff' opacity='.95'/></g></defs><rect width='1600' height='1000' fill='url(%23leaf)'/><rect width='1600' height='1000' fill='url(%23tile)'/><g fill='none' stroke='%23e4ff9a' stroke-width='3' opacity='.28' stroke-linecap='round'><path d='M -100 620 Q 800 420 1700 300'/><path d='M 60 600 q 120 -220 260 -420'/><path d='M 150 620 q 60 180 200 360'/><path d='M 240 565 q 120 -220 260 -420'/><path d='M 330 585 q 60 180 200 360'/><path d='M 420 530 q 120 -220 260 -420'/><path d='M 510 550 q 60 180 200 360'/><path d='M 600 495 q 120 -220 260 -420'/><path d='M 690 515 q 60 180 200 360'/><path d='M 780 460 q 120 -220 260 -420'/><path d='M 870 480 q 60 180 200 360'/><path d='M 960 425 q 120 -220 260 -420'/><path d='M 1050 445 q 60 180 200 360'/><path d='M 1140 390 q 120 -220 260 -420'/><path d='M 1230 410 q 60 180 200 360'/><path d='M 1320 355 q 120 -220 260 -420'/><path d='M 1410 375 q 60 180 200 360'/><path d='M 1500 320 q 120 -220 260 -420'/><path d='M 1590 340 q 60 180 200 360'/></g><use href='%23d' transform='translate(1517 395)scale(12 11.5)' stroke-width='0.1'/><use href='%23d' transform='translate(151 583)scale(24 27.2)' stroke-width='0.07'/><use href='%23d' transform='translate(60 434)scale(8 7.7)' stroke-width='0.15'/><use href='%23d' transform='translate(882 59)scale(6 6.4)' stroke-width='0.2'/><use href='%23d' transform='translate(1009 583)scale(8 7.7)' stroke-width='0.15'/><use href='%23d' transform='translate(235 976)scale(32 30.7)' stroke-width='0.07'/><use href='%23d' transform='translate(463 144)scale(8 7.8)' stroke-width='0.15'/><use href='%23d' transform='translate(896 682)scale(10 9.7)' stroke-width='0.12'/><use href='%23d' transform='translate(1422 372)scale(32 33.9)' stroke-width='0.07'/><use href='%23d' transform='translate(903 619)scale(6 6.3)' stroke-width='0.2'/><use href='%23d' transform='translate(284 314)scale(24 25.6)' stroke-width='0.07'/><use href='%23d' transform='translate(579 248)scale(18 17.7)' stroke-width='0.07'/><use href='%23d' transform='translate(131 300)scale(8 8.4)' stroke-width='0.15'/><use href='%23d' transform='translate(1167 288)scale(12 13.8)' stroke-width='0.1'/><use href='%23d' transform='translate(819 165)scale(6 6.1)' stroke-width='0.2'/><use href='%23d' transform='translate(675 962)scale(18 17.4)' stroke-width='0.07'/><use href='%23d' transform='translate(1317 875)scale(24 24.3)' stroke-width='0.07'/><use href='%23d' transform='translate(160 497)scale(60 66.6)' stroke-width='0.07'/><use href='%23d' transform='translate(1344 945)scale(6 6.3)' stroke-width='0.2'/><use href='%23d' transform='translate(104 731)scale(44 44.5)' stroke-width='0.07'/><use href='%23d' transform='translate(1589 822)scale(32 32.2)' stroke-width='0.07'/><use href='%23d' transform='translate(1419 347)scale(14 15.9)' stroke-width='0.086'/><use href='%23d' transform='translate(269 117)scale(12 11.5)' stroke-width='0.1'/><use href='%23d' transform='translate(207 248)scale(10 10.3)' stroke-width='0.12'/><use href='%23d' transform='translate(129 449)scale(18 19.1)' stroke-width='0.07'/><use href='%23d' transform='translate(1311 864)scale(8 8.0)' stroke-width='0.15'/><use href='%23d' transform='translate(1578 683)scale(14 14.4)' stroke-width='0.086'/><use href='%23d' transform='translate(241 176)scale(8 8.0)' stroke-width='0.15'/><use href='%23d' transform='translate(19 831)scale(8 7.9)' stroke-width='0.15'/><use href='%23d' transform='translate(7 419)scale(10 10.2)' stroke-width='0.12'/><use href='%23d' transform='translate(110 125)scale(32 35.9)' stroke-width='0.07'/><use href='%23d' transform='translate(1448 740)scale(32 33.3)' stroke-width='0.07'/><use href='%23d' transform='translate(1277 392)scale(44 45.3)' stroke-width='0.07'/><use href='%23d' transform='translate(770 400)scale(6 5.9)' stroke-width='0.2'/><use href='%23d' transform='translate(705 110)scale(8 8.6)' stroke-width='0.15'/><use href='%23d' transform='translate(0 151)scale(6 5.8)' stroke-width='0.2'/><use href='%23d' transform='translate(982 70)scale(12 11.9)' stroke-width='0.1'/><use href='%23d' transform='translate(238 252)scale(14 14.3)' stroke-width='0.086'/><use href='%23d' transform='translate(759 115)scale(12 12.6)' stroke-width='0.1'/><use href='%23d' transform='translate(769 312)scale(18 17.6)' stroke-width='0.07'/><use href='%23d' transform='translate(148 265)scale(60 66.9)' stroke-width='0.07'/><use href='%23d' transform='translate(826 205)scale(8 9.1)' stroke-width='0.15'/><use href='%23d' transform='translate(235 543)scale(12 11.5)' stroke-width='0.1'/><use href='%23d' transform='translate(77 643)scale(24 23.2)' stroke-width='0.07'/><use href='%23d' transform='translate(829 908)scale(10 10.2)' stroke-width='0.12'/><use href='%23d' transform='translate(852 779)scale(8 8.1)' stroke-width='0.15'/><use href='%23d' transform='translate(981 788)scale(8 8.8)' stroke-width='0.15'/><use href='%23d' transform='translate(1290 818)scale(8 8.8)' stroke-width='0.15'/><use href='%23d' transform='translate(320 493)scale(8 8.8)' stroke-width='0.15'/><use href='%23d' transform='translate(1264 472)scale(5 4.9)' stroke-width='0.24'/><use href='%23d' transform='translate(1530 447)scale(32 36.4)' stroke-width='0.07'/><use href='%23d' transform='translate(1528 365)scale(12 11.9)' stroke-width='0.1'/><use href='%23d' transform='translate(752 338)scale(8 8.4)' stroke-width='0.15'/><use href='%23d' transform='translate(1345 479)scale(32 34.6)' stroke-width='0.07'/><use href='%23d' transform='translate(136 661)scale(44 49.8)' stroke-width='0.07'/><use href='%23d' transform='translate(1200 478)scale(60 59.1)' stroke-width='0.07'/><use href='%23d' transform='translate(132 801)scale(44 50.4)' stroke-width='0.07'/><use href='%23d' transform='translate(741 743)scale(14 13.5)' stroke-width='0.086'/><use href='%23d' transform='translate(272 127)scale(8 7.8)' stroke-width='0.15'/><use href='%23d' transform='translate(1290 146)scale(18 20.1)' stroke-width='0.07'/><use href='%23d' transform='translate(1052 350)scale(18 19.1)' stroke-width='0.07'/><use href='%23d' transform='translate(34 799)scale(8 8.8)' stroke-width='0.15'/><use href='%23d' transform='translate(843 934)scale(6 6.2)' stroke-width='0.2'/><use href='%23d' transform='translate(1322 211)scale(8 8.0)' stroke-width='0.15'/><use href='%23d' transform='translate(802 764)scale(10 10.2)' stroke-width='0.12'/><use href='%23d' transform='translate(270 131)scale(24 27.2)' stroke-width='0.07'/><use href='%23d' transform='translate(1436 662)scale(12 13.4)' stroke-width='0.1'/><use href='%23d' transform='translate(273 918)scale(24 25.2)' stroke-width='0.07'/><use href='%23d' transform='translate(243 511)scale(24 27.0)' stroke-width='0.07'/><use href='%23d' transform='translate(974 776)scale(8 7.8)' stroke-width='0.15'/><use href='%23d' transform='translate(758 725)scale(8 8.5)' stroke-width='0.15'/><use href='%23d' transform='translate(1092 531)scale(12 12.6)' stroke-width='0.1'/><use href='%23d' transform='translate(1413 57)scale(6 5.9)' stroke-width='0.2'/><use href='%23d' transform='translate(1236 508)scale(5 5.3)' stroke-width='0.24'/><use href='%23d' transform='translate(709 613)scale(6 6.3)' stroke-width='0.2'/><use href='%23d' transform='translate(319 277)scale(24 25.2)' stroke-width='0.07'/><use href='%23d' transform='translate(812 248)scale(18 19.0)' stroke-width='0.07'/><use href='%23d' transform='translate(1476 893)scale(10 9.9)' stroke-width='0.12'/><use href='%23d' transform='translate(219 122)scale(18 18.7)' stroke-width='0.07'/><use href='%23d' transform='translate(1074 428)scale(6 6.0)' stroke-width='0.2'/><use href='%23d' transform='translate(1254 897)scale(10 9.8)' stroke-width='0.12'/><use href='%23d' transform='translate(1430 366)scale(60 60.0)' stroke-width='0.07'/><use href='%23d' transform='translate(1548 220)scale(8 9.1)' stroke-width='0.15'/><use href='%23d' transform='translate(1416 163)scale(14 15.2)' stroke-width='0.086'/><use href='%23d' transform='translate(258 432)scale(8 8.4)' stroke-width='0.15'/><use href='%23d' transform='translate(674 357)scale(12 11.6)' stroke-width='0.1'/><use href='%23d' transform='translate(31 554)scale(12 12.5)' stroke-width='0.1'/><use href='%23d' transform='translate(615 517)scale(5 5.0)' stroke-width='0.24'/><use href='%23d' transform='translate(181 919)scale(6 6.0)' stroke-width='0.2'/><use href='%23d' transform='translate(134 272)scale(6 6.8)' stroke-width='0.2'/><use href='%23d' transform='translate(433 130)scale(8 8.3)' stroke-width='0.15'/><use href='%23d' transform='translate(1310 259)scale(44 43.1)' stroke-width='0.07'/><use href='%23d' transform='translate(1313 700)scale(24 23.2)' stroke-width='0.07'/><use href='%23d' transform='translate(1279 183)scale(5 5.6)' stroke-width='0.24'/><use href='%23d' transform='translate(1501 634)scale(10 11.1)' stroke-width='0.12'/><use href='%23d' transform='translate(973 222)scale(6 6.0)' stroke-width='0.2'/><use href='%23d' transform='translate(726 339)scale(6 6.4)' stroke-width='0.2'/><use href='%23d' transform='translate(995 43)scale(10 10.9)' stroke-width='0.12'/><use href='%23d' transform='translate(1551 262)scale(6 5.9)' stroke-width='0.2'/><use href='%23d' transform='translate(1006 531)scale(10 9.9)' stroke-width='0.12'/><use href='%23d' transform='translate(800 178)scale(18 18.3)' stroke-width='0.07'/><use href='%23d' transform='translate(1591 37)scale(5 4.8)' stroke-width='0.24'/><use href='%23d' transform='translate(1282 189)scale(24 25.1)' stroke-width='0.07'/><use href='%23d' transform='translate(170 819)scale(18 18.7)' stroke-width='0.07'/><use href='%23d' transform='translate(873 889)scale(18 20.6)' stroke-width='0.07'/><use href='%23d' transform='translate(1100 982)scale(10 10.2)' stroke-width='0.12'/><use href='%23d' transform='translate(1566 140)scale(60 68.9)' stroke-width='0.07'/><use href='%23d' transform='translate(1339 14)scale(5 5.4)' stroke-width='0.24'/><use href='%23d' transform='translate(689 55)scale(10 10.8)' stroke-width='0.12'/><use href='%23d' transform='translate(1393 671)scale(14 14.1)' stroke-width='0.086'/><use href='%23d' transform='translate(1108 45)scale(8 7.9)' stroke-width='0.15'/><use href='%23d' transform='translate(713 263)scale(10 11.4)' stroke-width='0.12'/><use href='%23d' transform='translate(118 34)scale(24 27.0)' stroke-width='0.07'/><use href='%23d' transform='translate(571 1)scale(8 8.2)' stroke-width='0.15'/><use href='%23d' transform='translate(446 656)scale(18 18.0)' stroke-width='0.07'/><use href='%23d' transform='translate(145 817)scale(5 4.9)' stroke-width='0.24'/><use href='%23d' transform='translate(67 22)scale(32 32.3)' stroke-width='0.07'/><use href='%23d' transform='translate(135 958)scale(8 9.0)' stroke-width='0.15'/><use href='%23d' transform='translate(1052 716)scale(8 9.0)' stroke-width='0.15'/><use href='%23d' transform='translate(1223 721)scale(14 14.7)' stroke-width='0.086'/></svg>\") center / cover fixed !important;}&[data-technozen-interactive=\"on\"]{background-image: url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='leaf' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23c4f24e'/><stop offset='.45' stop-color='%2384d431'/><stop offset='1' stop-color='%232f8f1c'/></linearGradient><filter id='cells' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='.02 .035' numOctaves='2' seed='7'/><feColorMatrix type='matrix' values='0 0 0 0 .55  0 0 0 0 .95  0 0 0 0 .25  0 0 0 .2 0'/></filter><pattern id='tile' width='400' height='400' patternUnits='userSpaceOnUse'><rect width='400' height='400' filter='url(%23cells)'/></pattern><radialGradient id='body' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23fff' stop-opacity='.04'/><stop offset='.62' stop-color='%23eaffc8' stop-opacity='.1'/><stop offset='.86' stop-color='%233f9a28' stop-opacity='.22'/><stop offset='1' stop-color='%230d4a12' stop-opacity='.55'/></radialGradient><linearGradient id='rim' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23fff' stop-opacity='.75'/><stop offset='.45' stop-color='%234caa2c' stop-opacity='.2'/><stop offset='1' stop-color='%230b3d0f' stop-opacity='.8'/></linearGradient><radialGradient id='shadow' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23063a0a' stop-opacity='.38'/><stop offset='.6' stop-color='%23063a0a' stop-opacity='.18'/><stop offset='1' stop-color='%23063a0a' stop-opacity='0'/></radialGradient><radialGradient id='highlight' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23fff' stop-opacity='.9'/><stop offset='.55' stop-color='%23fff' stop-opacity='.45'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></radialGradient><radialGradient id='caustic' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='%23fff' stop-opacity='.4'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></radialGradient><g id='d'><ellipse rx='1.1' ry='.7' cx='.3' cy='.65' fill='url(%23shadow)'/><ellipse rx='1' ry='1' fill='url(%23body)'/><ellipse rx='1' ry='1' fill='none' stroke='url(%23rim)'/><ellipse rx='.5' ry='.2' cx='.05' cy='.62' fill='url(%23caustic)'/><ellipse rx='.42' ry='.3' cx='-.3' cy='-.4' fill='url(%23highlight)'/><ellipse rx='.13' ry='.08' cx='-.36' cy='-.5' fill='%23fff' opacity='.95'/></g></defs><rect width='1600' height='1000' fill='url(%23leaf)'/><rect width='1600' height='1000' fill='url(%23tile)'/><g fill='none' stroke='%23e4ff9a' stroke-width='3' opacity='.28' stroke-linecap='round'><path d='M -100 620 Q 800 420 1700 300'/><path d='M 60 600 q 120 -220 260 -420'/><path d='M 150 620 q 60 180 200 360'/><path d='M 240 565 q 120 -220 260 -420'/><path d='M 330 585 q 60 180 200 360'/><path d='M 420 530 q 120 -220 260 -420'/><path d='M 510 550 q 60 180 200 360'/><path d='M 600 495 q 120 -220 260 -420'/><path d='M 690 515 q 60 180 200 360'/><path d='M 780 460 q 120 -220 260 -420'/><path d='M 870 480 q 60 180 200 360'/><path d='M 960 425 q 120 -220 260 -420'/><path d='M 1050 445 q 60 180 200 360'/><path d='M 1140 390 q 120 -220 260 -420'/><path d='M 1230 410 q 60 180 200 360'/><path d='M 1320 355 q 120 -220 260 -420'/><path d='M 1410 375 q 60 180 200 360'/><path d='M 1500 320 q 120 -220 260 -420'/><path d='M 1590 340 q 60 180 200 360'/></g></svg>\") !important;}.bg-surface-1,.bg-surface-2,.dframe-root,.dframe-content,.dframe-pane{background-color: transparent !important;}main{background-color: rgba(255,255,255,0.38) !important;}nav,aside,.dframe-sidebar,[data-cds=\"Panel\"],[data-cds=\"Card\"]>.cds-card-fill,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"Popover\"],[data-cds=\"Menu\"]{border-radius: 22px;box-shadow: inset 0 1px 0 rgba(255,255,255,0.9),inset 0 0 0 1px rgba(255,255,255,0.45),0 10px 30px rgba(0,60,0,0.25);}nav,aside,.dframe-sidebar,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"ChatComposer\"]{backdrop-filter: blur(14px) saturate(1.4);}[data-row]{border-radius: 999px !important;}[data-cds=\"Button\"]{min-height: 2.6em;padding: 0.3em 1.2em;border-radius: 999px !important;border: 0 !important;color: #263028 !important;text-shadow: 0 1px 0 rgba(255,255,255,0.55);box-shadow: 0 6px 14px rgba(0,60,0,0.35),0 1px 2px rgba(0,60,0,0.3) !important;transition: transform 0.15s,box-shadow 0.15s;}[data-cds=\"Button\"][data-cds-icon-only]{aspect-ratio: 44 / 52;padding: 0 !important;border-radius: 50% 50% 50% 50% / 46% 46% 54% 54% !important;}[data-cds=\"Button\"]>[data-cds-part=\"paint\"],[data-cds=\"Button\"]>.cds-btn-squish{overflow: hidden;background: radial-gradient(ellipse 60% 45% at 50% 108%,rgba(255,255,255,0.6),transparent 70%),radial-gradient(ellipse at 50% 50%,rgba(255,255,255,0.3) 50%,rgba(140,215,90,0.35) 78%,rgba(20,90,20,0.5) 100%) !important;box-shadow: inset 0 2px 3px rgba(255,255,255,0.95),inset 0 -8px 12px rgba(0,70,0,0.25),inset 0 0 0 1px rgba(255,255,255,0.4) !important;}[data-cds=\"Button\"]>[data-cds-part=\"paint\"]::before,[data-cds=\"Button\"]>.cds-btn-squish::before{content: \"\";position: absolute;left: 12%;top: 8%;width: 44%;height: 34%;border-radius: 50%;background: radial-gradient(ellipse at 38% 38%,#fff 18%,rgba(255,255,255,0.55) 50%,transparent 100%);pointer-events: none;}[data-cds=\"Button\"]:hover{transform: translateY(-1px) scale(1.03);}[data-cds=\"Button\"]:active{transform: translateY(1px) scale(0.98);}[data-cds=\"TextInput\"],[data-cds=\"TextArea\"],[data-cds=\"ChatComposer\"],.ProseMirror{background: rgba(255,255,255,0.62) !important;border-radius: 24px !important;box-shadow: inset 0 2px 4px rgba(255,255,255,0.95),inset 0 -6px 12px rgba(0,70,0,0.15),0 6px 16px rgba(0,60,0,0.25) !important;}[data-cds=\"TextInput\"]{border-radius: 999px !important;}[data-cds=\"UserMessage\"]>*{box-shadow: inset 0 1px 0 rgba(255,255,255,0.9),0 6px 14px rgba(0,60,0,0.22);}h1,h2{text-shadow: 0 1px 0 rgba(255,255,255,0.8),0 2px 6px rgba(255,255,255,0.5);}pre,.code-block__code,.epitaxy-codeblock{background: rgba(255,255,255,0.78) !important;}.dframe-root,.ProseMirror,[data-cds=\"Panel\"]{scrollbar-color: rgba(255,255,255,0.6) transparent;scrollbar-width: thin;}\n}\n", "sakura": "html[data-technozen=\"sakura\"],html[data-technozen=\"sakura\"] *{color-scheme: light !important;--cds-page-bg: #FCEFEF !important;--cds-surface-1: #FCEFEF !important;--cds-surface-2: #FCEFEF !important;--cds-fill-field: #FCEFEF !important;--cds-surface-0: #FFF8F7 !important;--cds-surface-3: #FFF8F7 !important;--cds-surface-panel: #FFF8F7 !important;--cds-surface-popover: #FFF8F7 !important;--cds-fizzy-lake-color-sidebar: #FFF8F7 !important;--cds-fizzy-lake-color-card-hover: #FCC9B980 !important;--df-bg-page: #FCEFEF !important;--df-sidebar-bg: #FFF8F7 !important;--df-web-sidebar-bg: #FFF8F7 !important;--df-sidebar-tint: #FFF8F7 !important;--surface-panel: #FFF8F7 !important;--surface-popover: #FFF8F7 !important;--cds-text-primary: #4A3A3A !important;--cds-text-secondary: #866E6C !important;--cds-text-muted: #866E6C !important;--cds-text-stays-secondary: #866E6C !important;--cds-tooltip-bg: #4A3A3A !important;--cds-fill-primary: #4A3A3A !important;--cds-fill-primary-hover: #866E6C !important;--cds-on-primary: #FCEFEF !important;--cds-alpha-1: #4A3A3A0D !important;--cds-alpha-2: #4A3A3A1A !important;--cds-alpha-3: #4A3A3A33 !important;--cds-backdrop: #4A3A3A73 !important;--cds-border: #EBD3D1 !important;--cds-border-line: #EBD3D1 !important;--cds-fizzy-lake-color-seam: #EBD3D1 !important;--cds-fizzy-lake-color-composer-ring: #EBD3D1 !important;--cds-ring-color: #EBD3D1 !important;--cds-border-strong: #866E6C66 !important;--cds-border-stronger: #866E6C99 !important;--cds-role-accent-400: #BC4E68 !important;--cds-role-accent-450: #BC4E68 !important;--cds-role-accent-600: #A0495C !important;--cds-fill-accent: #BC4E68 !important;--cds-fill-accent-hover: #AB4B61 !important;--cds-text-accent: #A0495C !important;--cds-role-accent-on: #FFFFFF !important;--cds-on-accent: #FFFFFF !important;--cds-border-accent: #BC4E6859 !important;--cds-bg-accent: #BC4E6824 !important;--cds-bg-accent-muted: #BC4E681A !important;--cds-bg-accent-chip: #BC4E6824 !important;--cds-bg-accent-layer: #BC4E6812 !important;--cds-clay: #BC4E68 !important;--cds-clay-emphasized: #AB4B61 !important;--cds-bg-user-message: #9C7A6638 !important;--cds-fill-pro: #9C7A66 !important;--cds-bg-pro: #9C7A6624 !important;--cds-bg-highlight: #FCC9B98C !important;--cds-fill-ghost-hover: #FCC9B973 !important;--cds-fill-ghost-selected: #FCC9B9BF !important;--cds-fill-secondary: #FCC9B959 !important;--cds-fill-secondary-hover: #FCC9B98C !important;--cds-fill-button-ghost-hover: #FCC9B98C !important;--cds-bg-neutral: #FCC9B959 !important;--cds-bg-neutral-hover: #FCC9B98C !important;--cds-fizzy-lake-color-selected-hover: #FCC9B9CC !important;--df-hover: #FCC9B973 !important;--df-selected: #FCC9B9BF !important;--df-selected-base: #FCC9B9 !important;--cds-neutral-0: #FCEFEF !important;--cds-neutral-10: #FAEDED !important;--cds-neutral-20: #F8EBEB !important;--cds-neutral-30: #F6E9E9 !important;--cds-neutral-40: #F4E7E7 !important;--cds-neutral-50: #F2E5E5 !important;--cds-neutral-60: #F0E3E3 !important;--cds-neutral-70: #EEE1E1 !important;--cds-neutral-80: #ECDFDF !important;--cds-neutral-90: #EADDDD !important;--cds-neutral-100: #E8DBDB !important;--cds-neutral-150: #DED1D1 !important;--cds-neutral-200: #D4C7C7 !important;--cds-neutral-250: #CBBDBD !important;--cds-neutral-300: #C1B3B3 !important;--cds-neutral-400: #AD9F9F !important;--cds-neutral-500: #998A8A !important;--cds-neutral-600: #857676 !important;--cds-neutral-700: #726262 !important;--cds-neutral-800: #5E4E4E !important;--cds-neutral-850: #544444 !important;--cds-neutral-900: #4A3A3A !important;--bg-000: 7.5 100.0% 98.4% !important;--bg-200: 7.5 100.0% 98.4% !important;--bg-300: 7.5 100.0% 98.4% !important;--bg-400: 4.6 39.4% 87.1% !important;--text-000: 0.0 12.1% 25.9% !important;--text-100: 0.0 12.1% 25.9% !important;--text-200: 0.0 12.1% 25.9% !important;--text-300: 4.6 10.7% 47.5% !important;--text-400: 4.6 10.7% 47.5% !important;--text-500: 4.6 10.7% 47.5% !important;--border-100: 4.6 10.7% 47.5% !important;--border-300: 4.6 10.7% 47.5% !important;--brand-000: 345.8 45.1% 52.2% !important;--brand-100: 345.8 45.1% 52.2% !important;--brand-200: 345.8 45.1% 52.2% !important;--accent-000: 346.9 37.3% 45.7% !important;--accent-100: 345.8 45.1% 52.2% !important;--oncolor-100: 0.0 0.0% 100.0% !important;--pictogram-100: 4.6 39.4% 87.1% !important;--df-z0: 0.0 68.4% 96.3% !important;--df-z1: 7.5 100.0% 98.4% !important;--df-z2: 7.5 100.0% 98.4% !important;--df-z4: 4.6 39.4% 87.1% !important;--df-bg-page-hsl: 0.0 68.4% 96.3% !important;}\nhtml[data-technozen=\"sakura\"][data-technozen-skin=\"on\"] {\n&,& *{--df-bg-page: transparent !important;--cds-surface-0: rgba(255,248,247,0.84) !important;--cds-surface-3: rgba(255,248,247,0.92) !important;--cds-fill-primary: #bc4e68 !important;--cds-fill-primary-hover: #c95f78 !important;--cds-on-primary: #ffffff !important;}&{background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .2 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E\") repeat,radial-gradient(50vw 40vh at 10% 100%,rgba(252,201,185,0.5),transparent 70%),linear-gradient(180deg,#fcefef,#f8e6e3) !important;background-attachment: fixed !important;}.bg-surface-1,.bg-surface-2,.dframe-root,.dframe-content,.dframe-pane,main{background-color: transparent !important;}&::after{content: \"\";position: fixed;inset: 0;z-index: -1;pointer-events: none;background: radial-gradient(ellipse 9px 13px at 82% 8%,#fcc9b9 60%,transparent 62%),radial-gradient(ellipse 8px 12px at 90% 16%,#f7b8c4 60%,transparent 62%),radial-gradient(ellipse 7px 11px at 76% 22%,#fcc9b9 60%,transparent 62%),radial-gradient(ellipse 9px 13px at 95% 30%,#f3a0aa 60%,transparent 62%),radial-gradient(ellipse 6px 10px at 86% 38%,#fcc9b9 60%,transparent 62%),radial-gradient(ellipse 8px 12px at 70% 44%,#f7b8c4 60%,transparent 62%),radial-gradient(ellipse 7px 11px at 93% 58%,#fcc9b9 60%,transparent 62%);opacity: 0.55;animation: technozen-drift 40s steps(160) infinite alternate;}@media (prefers-reduced-motion: reduce){&::after{animation: none;}}nav,aside,.dframe-sidebar{background: repeating-linear-gradient(90deg,rgba(120,90,60,0.06) 0 2px,transparent 2px 7px),repeating-linear-gradient(90deg,rgba(120,90,60,0.05) 0 1px,transparent 1px 11px),repeating-linear-gradient(90deg,rgba(120,90,60,0.04) 0 3px,transparent 3px 19px),linear-gradient(90deg,#ead9c7,#e2cdb7) !important;box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);}[data-cds=\"Panel\"],[data-cds=\"Card\"]>.cds-card-fill,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"Popover\"],[data-cds=\"Menu\"]{border-radius: 14px;border: 1px solid #ebd3d1;box-shadow: inset 0 1px 0 rgba(255,255,255,0.9),0 8px 24px rgba(74,58,58,0.1);}[data-cds=\"Button\"]{border-radius: 12px !important;border: 0 !important;box-shadow: inset 0 1px 0 rgba(255,255,255,0.45),0 0 0 1px rgba(156,122,102,0.35),0 3px 8px rgba(74,58,58,0.12) !important;transition: transform 0.15s,box-shadow 0.15s,filter 0.15s;}[data-cds=\"Button\"]:hover{transform: translateY(-1px);box-shadow: inset 0 1px 0 rgba(255,255,255,0.45),0 0 0 4px rgba(252,201,185,0.6),0 3px 8px rgba(74,58,58,0.12) !important;}[data-cds=\"Button\"]:active{filter: brightness(0.94);}h1,h2{font-family: \"Yu Mincho\",\"Hiragino Mincho ProN\",Georgia,serif !important;font-weight: 400 !important;letter-spacing: 0.02em;}\n}\n@keyframes technozen-drift{to{transform: translate(-30px,60px) rotate(6deg);}}", "mizu": "html[data-technozen=\"mizu\"],html[data-technozen=\"mizu\"] *{color-scheme: dark !important;--cds-page-bg: #0B2A3F !important;--cds-surface-1: #0B2A3F !important;--cds-surface-2: #0B2A3F !important;--cds-fill-field: #0B2A3F !important;--cds-surface-0: #123A55 !important;--cds-surface-3: #123A55 !important;--cds-surface-panel: #123A55 !important;--cds-surface-popover: #123A55 !important;--cds-fizzy-lake-color-sidebar: #123A55 !important;--cds-fizzy-lake-color-card-hover: #1E6A8C80 !important;--df-bg-page: #0B2A3F !important;--df-sidebar-bg: #123A55 !important;--df-web-sidebar-bg: #123A55 !important;--df-sidebar-tint: #123A55 !important;--surface-panel: #123A55 !important;--surface-popover: #123A55 !important;--cds-text-primary: #E8F6FB !important;--cds-text-secondary: #9CC2D4 !important;--cds-text-muted: #9CC2D4 !important;--cds-text-stays-secondary: #9CC2D4 !important;--cds-tooltip-bg: #E8F6FB !important;--cds-fill-primary: #E8F6FB !important;--cds-fill-primary-hover: #9CC2D4 !important;--cds-on-primary: #0B2A3F !important;--cds-alpha-1: #E8F6FB0D !important;--cds-alpha-2: #E8F6FB1A !important;--cds-alpha-3: #E8F6FB33 !important;--cds-backdrop: #E8F6FB73 !important;--cds-border: #1F5478 !important;--cds-border-line: #1F5478 !important;--cds-fizzy-lake-color-seam: #1F5478 !important;--cds-fizzy-lake-color-composer-ring: #1F5478 !important;--cds-ring-color: #1F5478 !important;--cds-border-strong: #9CC2D466 !important;--cds-border-stronger: #9CC2D499 !important;--cds-role-accent-400: #2ED3C4 !important;--cds-role-accent-450: #2ED3C4 !important;--cds-role-accent-600: #5CDCD2 !important;--cds-fill-accent: #2ED3C4 !important;--cds-fill-accent-hover: #4AD8CC !important;--cds-text-accent: #5CDCD2 !important;--cds-role-accent-on: #111111 !important;--cds-on-accent: #111111 !important;--cds-border-accent: #2ED3C459 !important;--cds-bg-accent: #2ED3C424 !important;--cds-bg-accent-muted: #2ED3C41A !important;--cds-bg-accent-chip: #2ED3C424 !important;--cds-bg-accent-layer: #2ED3C412 !important;--cds-clay: #2ED3C4 !important;--cds-clay-emphasized: #4AD8CC !important;--cds-bg-user-message: #8FE36B38 !important;--cds-fill-pro: #8FE36B !important;--cds-bg-pro: #8FE36B24 !important;--cds-bg-highlight: #1E6A8C8C !important;--cds-fill-ghost-hover: #1E6A8C73 !important;--cds-fill-ghost-selected: #1E6A8CBF !important;--cds-fill-secondary: #1E6A8C59 !important;--cds-fill-secondary-hover: #1E6A8C8C !important;--cds-fill-button-ghost-hover: #1E6A8C8C !important;--cds-bg-neutral: #1E6A8C59 !important;--cds-bg-neutral-hover: #1E6A8C8C !important;--cds-fizzy-lake-color-selected-hover: #1E6A8CCC !important;--df-hover: #1E6A8C73 !important;--df-selected: #1E6A8CBF !important;--df-selected-base: #1E6A8C !important;--cds-neutral-0: #0B2A3F !important;--cds-neutral-10: #0D2C41 !important;--cds-neutral-20: #102F43 !important;--cds-neutral-30: #123145 !important;--cds-neutral-40: #153347 !important;--cds-neutral-50: #173549 !important;--cds-neutral-60: #1A384C !important;--cds-neutral-70: #1C3A4E !important;--cds-neutral-80: #1F3C50 !important;--cds-neutral-90: #213E52 !important;--cds-neutral-100: #244154 !important;--cds-neutral-150: #304C5E !important;--cds-neutral-200: #3C5769 !important;--cds-neutral-250: #486373 !important;--cds-neutral-300: #556E7E !important;--cds-neutral-400: #6D8593 !important;--cds-neutral-500: #869BA7 !important;--cds-neutral-600: #9EB2BC !important;--cds-neutral-700: #B7C9D1 !important;--cds-neutral-800: #CFDFE6 !important;--cds-neutral-850: #DCEBF1 !important;--cds-neutral-900: #E8F6FB !important;--bg-000: 204.2 65.0% 20.2% !important;--bg-200: 204.2 65.0% 20.2% !important;--bg-300: 204.2 65.0% 20.2% !important;--bg-400: 204.3 58.9% 29.6% !important;--text-000: 195.8 70.4% 94.7% !important;--text-100: 195.8 70.4% 94.7% !important;--text-200: 195.8 70.4% 94.7% !important;--text-300: 199.3 39.4% 72.2% !important;--text-400: 199.3 39.4% 72.2% !important;--text-500: 199.3 39.4% 72.2% !important;--border-100: 199.3 39.4% 72.2% !important;--border-300: 199.3 39.4% 72.2% !important;--brand-000: 174.5 65.2% 50.4% !important;--brand-100: 174.5 65.2% 50.4% !important;--brand-200: 174.5 65.2% 50.4% !important;--accent-000: 175.3 64.6% 61.2% !important;--accent-100: 174.5 65.2% 50.4% !important;--oncolor-100: 0.0 0.0% 6.7% !important;--pictogram-100: 204.3 58.9% 29.6% !important;--df-z0: 204.2 70.3% 14.5% !important;--df-z1: 204.2 65.0% 20.2% !important;--df-z2: 204.2 65.0% 20.2% !important;--df-z4: 204.3 58.9% 29.6% !important;--df-bg-page-hsl: 204.2 70.3% 14.5% !important;}\nhtml[data-technozen=\"mizu\"][data-technozen-skin=\"on\"] {\n&,& *{--df-bg-page: transparent !important;--cds-surface-0: rgba(18,58,85,0.55) !important;--cds-surface-3: rgba(18,58,85,0.75) !important;--cds-surface-popover: rgba(18,58,85,0.9) !important;--cds-fizzy-lake-color-sidebar: rgba(18,58,85,0.5) !important;--df-sidebar-bg: rgba(18,58,85,0.5) !important;--df-web-sidebar-bg: rgba(18,58,85,0.5) !important;--cds-fill-primary: #2ed3c4 !important;--cds-fill-primary-hover: #5fe4d6 !important;--cds-on-primary: #0b2a3f !important;--cds-border: rgba(46,211,196,0.22) !important;--cds-border-line: rgba(46,211,196,0.22) !important;}&{background: radial-gradient(60vw 35vh at 30% -5%,rgba(46,211,196,0.2),transparent 70%),radial-gradient(45vw 30vh at 80% 10%,rgba(143,227,107,0.1),transparent 70%),repeating-radial-gradient(circle at 30% 20%,rgba(46,211,196,0.05) 0 2px,transparent 2px 38px),repeating-radial-gradient(circle at 70% 60%,rgba(46,211,196,0.04) 0 2px,transparent 2px 46px),linear-gradient(180deg,#0e3450 0%,#0b2a3f 45%,#071c2b 100%) !important;background-attachment: fixed !important;}.bg-surface-1,.bg-surface-2,.dframe-root,.dframe-content,.dframe-pane,main{background-color: transparent !important;}nav,aside,.dframe-sidebar,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"Popover\"],[data-cds=\"Menu\"]{backdrop-filter: blur(18px) saturate(1.3);}nav,aside,.dframe-sidebar,[data-cds=\"Panel\"],[data-cds=\"Card\"]>.cds-card-fill,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"Popover\"],[data-cds=\"Menu\"]{border-radius: 20px;border: 1px solid rgba(46,211,196,0.22);box-shadow: inset 0 1px 0 rgba(232,246,251,0.18),0 16px 40px rgba(0,0,0,0.35);}aside,.dframe-sidebar{position: relative;overflow: hidden;}aside::before,.dframe-sidebar::before{content: \"\";position: absolute;inset: 0 auto -320px 0;width: 48px;pointer-events: none;background: radial-gradient(circle at 14px 40px,transparent 7px,rgba(232,246,251,0.35) 8px,transparent 10px),radial-gradient(circle at 30px 120px,transparent 4px,rgba(232,246,251,0.35) 5px,transparent 7px),radial-gradient(circle at 20px 210px,transparent 9px,rgba(232,246,251,0.3) 10px,transparent 12px),radial-gradient(circle at 36px 280px,transparent 3px,rgba(232,246,251,0.35) 4px,transparent 6px);background-size: 48px 320px;animation: technozen-rise 18s steps(320) infinite;}@media (prefers-reduced-motion: reduce){aside::before,.dframe-sidebar::before{animation: none;}}[data-cds=\"Button\"]{border-radius: 999px !important;border: 1px solid rgba(46,211,196,0.4) !important;box-shadow: inset 0 1px 0 rgba(255,255,255,0.35),0 0 18px rgba(46,211,196,0.2) !important;transition: box-shadow 0.15s,filter 0.15s;}[data-cds=\"Button\"]:hover{box-shadow: inset 0 1px 0 rgba(255,255,255,0.5),0 0 28px rgba(46,211,196,0.55) !important;}[data-cds=\"Button\"]:active{filter: brightness(0.9);}[data-cds=\"ChatComposer\"],.ProseMirror{border-radius: 20px !important;}\n}\n@keyframes technozen-rise{to{transform: translateY(-320px);}}", "yoru": "html[data-technozen=\"yoru\"],html[data-technozen=\"yoru\"] *{color-scheme: dark !important;--cds-page-bg: #16181D !important;--cds-surface-1: #16181D !important;--cds-surface-2: #16181D !important;--cds-fill-field: #16181D !important;--cds-surface-0: #1F2229 !important;--cds-surface-3: #1F2229 !important;--cds-surface-panel: #1F2229 !important;--cds-surface-popover: #1F2229 !important;--cds-fizzy-lake-color-sidebar: #1F2229 !important;--cds-fizzy-lake-color-card-hover: #3A332080 !important;--df-bg-page: #16181D !important;--df-sidebar-bg: #1F2229 !important;--df-web-sidebar-bg: #1F2229 !important;--df-sidebar-tint: #1F2229 !important;--surface-panel: #1F2229 !important;--surface-popover: #1F2229 !important;--cds-text-primary: #ECEEF2 !important;--cds-text-secondary: #9A9FA8 !important;--cds-text-muted: #9A9FA8 !important;--cds-text-stays-secondary: #9A9FA8 !important;--cds-tooltip-bg: #ECEEF2 !important;--cds-fill-primary: #ECEEF2 !important;--cds-fill-primary-hover: #9A9FA8 !important;--cds-on-primary: #16181D !important;--cds-alpha-1: #ECEEF20D !important;--cds-alpha-2: #ECEEF21A !important;--cds-alpha-3: #ECEEF233 !important;--cds-backdrop: #ECEEF273 !important;--cds-border: #2C3038 !important;--cds-border-line: #2C3038 !important;--cds-fizzy-lake-color-seam: #2C3038 !important;--cds-fizzy-lake-color-composer-ring: #2C3038 !important;--cds-ring-color: #2C3038 !important;--cds-border-strong: #9A9FA866 !important;--cds-border-stronger: #9A9FA899 !important;--cds-role-accent-400: #F2B35B !important;--cds-role-accent-450: #F2B35B !important;--cds-role-accent-600: #F0C281 !important;--cds-fill-accent: #F2B35B !important;--cds-fill-accent-hover: #F1BC72 !important;--cds-text-accent: #F0C281 !important;--cds-role-accent-on: #111111 !important;--cds-on-accent: #111111 !important;--cds-border-accent: #F2B35B59 !important;--cds-bg-accent: #F2B35B24 !important;--cds-bg-accent-muted: #F2B35B1A !important;--cds-bg-accent-chip: #F2B35B24 !important;--cds-bg-accent-layer: #F2B35B12 !important;--cds-clay: #F2B35B !important;--cds-clay-emphasized: #F1BC72 !important;--cds-bg-user-message: #8FB3C938 !important;--cds-fill-pro: #8FB3C9 !important;--cds-bg-pro: #8FB3C924 !important;--cds-bg-highlight: #3A33208C !important;--cds-fill-ghost-hover: #3A332073 !important;--cds-fill-ghost-selected: #3A3320BF !important;--cds-fill-secondary: #3A332059 !important;--cds-fill-secondary-hover: #3A33208C !important;--cds-fill-button-ghost-hover: #3A33208C !important;--cds-bg-neutral: #3A332059 !important;--cds-bg-neutral-hover: #3A33208C !important;--cds-fizzy-lake-color-selected-hover: #3A3320CC !important;--df-hover: #3A332073 !important;--df-selected: #3A3320BF !important;--df-selected-base: #3A3320 !important;--cds-neutral-0: #16181D !important;--cds-neutral-10: #181A1F !important;--cds-neutral-20: #1B1D22 !important;--cds-neutral-30: #1D1F24 !important;--cds-neutral-40: #202226 !important;--cds-neutral-50: #222429 !important;--cds-neutral-60: #24262B !important;--cds-neutral-70: #27292E !important;--cds-neutral-80: #292B30 !important;--cds-neutral-90: #2B2D32 !important;--cds-neutral-100: #2E3035 !important;--cds-neutral-150: #3A3C40 !important;--cds-neutral-200: #46484C !important;--cds-neutral-250: #515358 !important;--cds-neutral-300: #5D5F64 !important;--cds-neutral-400: #75777C !important;--cds-neutral-500: #8D8F93 !important;--cds-neutral-600: #A5A7AB !important;--cds-neutral-700: #BCBEC3 !important;--cds-neutral-800: #D4D6DA !important;--cds-neutral-850: #E0E2E6 !important;--cds-neutral-900: #ECEEF2 !important;--bg-000: 222.0 13.9% 14.1% !important;--bg-200: 222.0 13.9% 14.1% !important;--bg-300: 222.0 13.9% 14.1% !important;--bg-400: 220.0 12.0% 19.6% !important;--text-000: 220.0 18.7% 93.7% !important;--text-100: 220.0 18.7% 93.7% !important;--text-200: 220.0 18.7% 93.7% !important;--text-300: 218.6 7.4% 63.1% !important;--text-400: 218.6 7.4% 63.1% !important;--text-500: 218.6 7.4% 63.1% !important;--border-100: 218.6 7.4% 63.1% !important;--border-300: 218.6 7.4% 63.1% !important;--brand-000: 35.0 85.3% 65.3% !important;--brand-100: 35.0 85.3% 65.3% !important;--brand-200: 35.0 85.3% 65.3% !important;--accent-000: 35.1 78.7% 72.4% !important;--accent-100: 35.0 85.3% 65.3% !important;--oncolor-100: 0.0 0.0% 6.7% !important;--pictogram-100: 220.0 12.0% 19.6% !important;--df-z0: 222.9 13.7% 10.0% !important;--df-z1: 222.0 13.9% 14.1% !important;--df-z2: 222.0 13.9% 14.1% !important;--df-z4: 220.0 12.0% 19.6% !important;--df-bg-page-hsl: 222.9 13.7% 10.0% !important;}\nhtml[data-technozen=\"yoru\"][data-technozen-skin=\"on\"] {\n&,& *{--df-bg-page: transparent !important;--cds-surface-0: rgba(31,34,41,0.94) !important;--cds-fill-primary: #f2b35b !important;--cds-fill-primary-hover: #f8cb82 !important;--cds-on-primary: #16181d !important;}&{background: radial-gradient(55vw 55vh at 70% 95%,rgba(242,179,91,0.16),rgba(242,179,91,0.05) 45%,transparent 70%),linear-gradient(180deg,#16181d,#101217) !important;background-attachment: fixed !important;}.bg-surface-1,.bg-surface-2,.dframe-root,.dframe-content,.dframe-pane,main{background-color: transparent !important;}nav,aside,.dframe-sidebar{background: repeating-linear-gradient(90deg,rgba(255,255,255,0.035) 0 1px,transparent 1px 64px),repeating-linear-gradient(0deg,rgba(255,255,255,0.035) 0 1px,transparent 1px 96px),#1b1e24 !important;box-shadow: inset -1px 0 0 #2c3038;}[data-cds=\"Panel\"],[data-cds=\"Card\"]>.cds-card-fill,[data-cds=\"Dialog\"],[role=\"dialog\"],[data-cds-popup],[data-cds=\"Popover\"],[data-cds=\"Menu\"]{border-radius: 12px;border: 1px solid #2c3038;box-shadow: inset 0 1px 0 rgba(255,255,255,0.045),0 14px 36px rgba(0,0,0,0.4);}[data-cds=\"Button\"]{border-radius: 10px !important;border: 1px solid #2c3038 !important;box-shadow: inset 0 1px 0 rgba(255,255,255,0.08),0 4px 10px rgba(0,0,0,0.5) !important;transition: box-shadow 0.15s,transform 0.1s,filter 0.15s;}[data-cds=\"Button\"]:hover{box-shadow: inset 0 1px 0 rgba(255,255,255,0.1),0 0 0 1px rgba(242,179,91,0.5),0 0 30px rgba(242,179,91,0.35) !important;}[data-cds=\"Button\"]:active{transform: translateY(1px);filter: brightness(0.9);}[data-cds=\"ChatComposer\"]{position: relative;}[data-cds=\"ChatComposer\"]::before{content: \"\";position: absolute;inset: -40% -10%;z-index: -1;pointer-events: none;background: radial-gradient(70% 160% at 50% 110%,rgba(242,179,91,0.28),transparent 70%);animation: technozen-breathe 7s steps(24) infinite alternate;}@media (prefers-reduced-motion: reduce){[data-cds=\"ChatComposer\"]::before{animation: none;}}[data-cds=\"ChatComposer\"],.ProseMirror{border-radius: 12px !important;box-shadow: 0 -1px 0 0 rgba(242,179,91,0.6),0 14px 36px rgba(0,0,0,0.4) !important;}pre,.code-block__code{background: #1b1d22 !important;}\n}\n@keyframes technozen-breathe{from{opacity: 0.75;}to{opacity: 1;}}"};
  const DROPS = {"w":1600,"h":1000,"defs":"<radialGradient id=\"body\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".04\"/><stop offset=\".62\" stop-color=\"#eaffc8\" stop-opacity=\".1\"/><stop offset=\".86\" stop-color=\"#3f9a28\" stop-opacity=\".22\"/><stop offset=\"1\" stop-color=\"#0d4a12\" stop-opacity=\".55\"/></radialGradient><linearGradient id=\"rim\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".75\"/><stop offset=\".45\" stop-color=\"#4caa2c\" stop-opacity=\".2\"/><stop offset=\"1\" stop-color=\"#0b3d0f\" stop-opacity=\".8\"/></linearGradient><radialGradient id=\"shadow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#063a0a\" stop-opacity=\".38\"/><stop offset=\".6\" stop-color=\"#063a0a\" stop-opacity=\".18\"/><stop offset=\"1\" stop-color=\"#063a0a\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"highlight\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".9\"/><stop offset=\".55\" stop-color=\"#fff\" stop-opacity=\".45\"/><stop offset=\"1\" stop-color=\"#fff\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"caustic\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\".4\"/><stop offset=\"1\" stop-color=\"#fff\" stop-opacity=\"0\"/></radialGradient><g id='d'><ellipse rx='1.1' ry='.7' cx='.3' cy='.65' fill='url(#shadow)'/><ellipse rx='1' ry='1' fill='url(#body)'/><ellipse rx='1' ry='1' fill='none' stroke='url(#rim)'/><ellipse rx='.5' ry='.2' cx='.05' cy='.62' fill='url(#caustic)'/><ellipse rx='.42' ry='.3' cx='-.3' cy='-.4' fill='url(#highlight)'/><ellipse rx='.13' ry='.08' cx='-.36' cy='-.5' fill='#fff' opacity='.95'/></g>","drops":[[1517,395,12,11.5,0.1],[151,583,24,27.2,0.07],[60,434,8,7.7,0.15],[882,59,6,6.4,0.2],[1009,583,8,7.7,0.15],[235,976,32,30.7,0.07],[463,144,8,7.8,0.15],[896,682,10,9.7,0.12],[1422,372,32,33.9,0.07],[903,619,6,6.3,0.2],[284,314,24,25.6,0.07],[579,248,18,17.7,0.07],[131,300,8,8.4,0.15],[1167,288,12,13.8,0.1],[819,165,6,6.1,0.2],[675,962,18,17.4,0.07],[1317,875,24,24.3,0.07],[160,497,60,66.6,0.07],[1344,945,6,6.3,0.2],[104,731,44,44.5,0.07],[1589,822,32,32.2,0.07],[1419,347,14,15.9,0.086],[269,117,12,11.5,0.1],[207,248,10,10.3,0.12],[129,449,18,19.1,0.07],[1311,864,8,8.0,0.15],[1578,683,14,14.4,0.086],[241,176,8,8.0,0.15],[19,831,8,7.9,0.15],[7,419,10,10.2,0.12],[110,125,32,35.9,0.07],[1448,740,32,33.3,0.07],[1277,392,44,45.3,0.07],[770,400,6,5.9,0.2],[705,110,8,8.6,0.15],[0,151,6,5.8,0.2],[982,70,12,11.9,0.1],[238,252,14,14.3,0.086],[759,115,12,12.6,0.1],[769,312,18,17.6,0.07],[148,265,60,66.9,0.07],[826,205,8,9.1,0.15],[235,543,12,11.5,0.1],[77,643,24,23.2,0.07],[829,908,10,10.2,0.12],[852,779,8,8.1,0.15],[981,788,8,8.8,0.15],[1290,818,8,8.8,0.15],[320,493,8,8.8,0.15],[1264,472,5,4.9,0.24],[1530,447,32,36.4,0.07],[1528,365,12,11.9,0.1],[752,338,8,8.4,0.15],[1345,479,32,34.6,0.07],[136,661,44,49.8,0.07],[1200,478,60,59.1,0.07],[132,801,44,50.4,0.07],[741,743,14,13.5,0.086],[272,127,8,7.8,0.15],[1290,146,18,20.1,0.07],[1052,350,18,19.1,0.07],[34,799,8,8.8,0.15],[843,934,6,6.2,0.2],[1322,211,8,8.0,0.15],[802,764,10,10.2,0.12],[270,131,24,27.2,0.07],[1436,662,12,13.4,0.1],[273,918,24,25.2,0.07],[243,511,24,27.0,0.07],[974,776,8,7.8,0.15],[758,725,8,8.5,0.15],[1092,531,12,12.6,0.1],[1413,57,6,5.9,0.2],[1236,508,5,5.3,0.24],[709,613,6,6.3,0.2],[319,277,24,25.2,0.07],[812,248,18,19.0,0.07],[1476,893,10,9.9,0.12],[219,122,18,18.7,0.07],[1074,428,6,6.0,0.2],[1254,897,10,9.8,0.12],[1430,366,60,60.0,0.07],[1548,220,8,9.1,0.15],[1416,163,14,15.2,0.086],[258,432,8,8.4,0.15],[674,357,12,11.6,0.1],[31,554,12,12.5,0.1],[615,517,5,5.0,0.24],[181,919,6,6.0,0.2],[134,272,6,6.8,0.2],[433,130,8,8.3,0.15],[1310,259,44,43.1,0.07],[1313,700,24,23.2,0.07],[1279,183,5,5.6,0.24],[1501,634,10,11.1,0.12],[973,222,6,6.0,0.2],[726,339,6,6.4,0.2],[995,43,10,10.9,0.12],[1551,262,6,5.9,0.2],[1006,531,10,9.9,0.12],[800,178,18,18.3,0.07],[1591,37,5,4.8,0.24],[1282,189,24,25.1,0.07],[170,819,18,18.7,0.07],[873,889,18,20.6,0.07],[1100,982,10,10.2,0.12],[1566,140,60,68.9,0.07],[1339,14,5,5.4,0.24],[689,55,10,10.8,0.12],[1393,671,14,14.1,0.086],[1108,45,8,7.9,0.15],[713,263,10,11.4,0.12],[118,34,24,27.0,0.07],[571,1,8,8.2,0.15],[446,656,18,18.0,0.07],[145,817,5,4.9,0.24],[67,22,32,32.3,0.07],[135,958,8,9.0,0.15],[1052,716,8,9.0,0.15],[1223,721,14,14.7,0.086]]};
  const html = document.documentElement;
  // Physics for the Take skin's water drops, with no page access. Lengths are leaf-image units, speeds are units per 1/60 s step.
// Speed limits are set for the leaf drawn at scale 1.6 (a 2560 wide window) and adjusted by bounds.s, so they hold on screen at any size.
function technozenWorld(list, W, H) {
  const REST = 102 * 60, VMAX = 1.2, VAPP = 0.25, MOUSE = 0.009, APP = 0.001, RANGE = 160, MARGIN = 30, CELL = 130, STILL = 1e-4, ENTER = 0.7, VZONE = 0.12, ZONE = 0.0012, RAMP = 120, LONG = 150, TINY = 3, SHRINK = Math.pow(0.9, 1 / 120), DEEP = 12, LEAVE = 0.5, EDGE = 0.995, DRIFT = 300 * 60, DRIFT_REACH = 380, DRIFT_SHARE = 0.7, VHULL = 0.7, HULL = 30, HULL_AGAIN = 90;
  const DRAG = 0.02; // grows with speed, as in water: a hard push dies quickly into a long, faint glide
  const n = list.length, X = new Float64Array(n), Y = new Float64Array(n), VX = new Float64Array(n), VY = new Float64Array(n), R = new Float64Array(n), LIGHT = new Float64Array(n), inside = new Uint8Array(n);
  list.forEach((d, i) => { X[i] = d[0]; Y[i] = d[1]; R[i] = d[2]; LIGHT[i] = Math.max(1.15, Math.min(4, Math.pow(50 / d[2], 1.5))); }); // big drops lean away more slowly, but not much
  const cols = Math.ceil((W + 1200) / CELL), rows = Math.ceil((H + 1200) / CELL), head = new Int32Array(cols * rows), next = new Int32Array(n);
  const painted = new Map(); // overlaps painted into the leaf hold no energy: only overlap beyond these pushes, and they shrink as drops part
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const o = R[i] + R[j] - Math.hypot(X[i] - X[j], Y[i] - Y[j]);
    if (o > 0) painted.set(i * n + j, o);
  }
  const clock = new Int32Array(n).fill(REST); // steps since each drop's own last push: one drop arriving must not keep the rest moving
  let seed = 12345, zones = [], borders = [], covers = [], drift = [], driftT = 0, pops = [], splashes = [];
  const lightness = r => Math.max(1.15, Math.min(4, Math.pow(50 / r, 1.5))); // big drops lean away more slowly, but not much

  // Past the tiniest size a drop pops. It stays in the lists with no size and far out of the way until it is brought back.
  function pop(i) {
    pops.push({ x: X[i], y: Y[i], r: R[i] });
    X[i] = Y[i] = -1e5; R[i] = 0; VX[i] = VY[i] = 0; clock[i] = REST; inside[i] = 0; easing[i] = 0; within[i] = 0; hull[i] = 0;
  }
  function revive(i, bounds) { // back at full size from outside the window, with the usual long glide in
    R[i] = list[i][2]; LIGHT[i] = lightness(R[i]);
    respawn(i, -1, bounds, 1.6 / (bounds.s || 1.6));
  }

  // The idle process. Once everything is at rest, 70% of the drops on view set off in one direction each, in a straight line, over 5 minutes,
  // placed rather than pushed, peaking near 2 px/s, too slowly to see. They all travel alike; only the direction differs, the roomiest of many random ones, so the gaps fill.
  function planDrift(bounds) {
    const k = bounds.s || 1.6, reach = DRIFT_REACH / k, inRect = (x, y, r, z) => x + r > z.x0 && x - r < z.x1 && y + r > z.y0 && y - r < z.y1;
    const shown = []; for (let i = 0; i < n; i++) if (R[i] > 0 && X[i] > bounds.l && X[i] < bounds.r && Y[i] > bounds.t && Y[i] < bounds.b) shown.push(i);
    for (let i = shown.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)), t = shown[i]; shown[i] = shown[j]; shown[j] = t; }
    const moving = shown.slice(0, Math.ceil(shown.length * DRIFT_SHARE)), leaving = new Uint8Array(n);
    for (const i of moving) leaving[i] = 1;
    const toX = Float64Array.from(X), toY = Float64Array.from(Y);
    drift = []; driftT = 0;
    for (const i of moving) {
      let best = -Infinity, bx = 0, by = 0;
      for (let d = reach; best === -Infinity && d > reach / 8; d /= 2) for (let tries = 0; tries < 48; tries++) { // the full distance, unless a tight spot allows only less
        const a = random() * 6.283, x = X[i] + Math.cos(a) * d, y = Y[i] + Math.sin(a) * d;
        if (x < bounds.l + R[i] || x > bounds.r - R[i] || y < bounds.t + R[i] || y > bounds.b - R[i]) continue;
        if (zones.some(z => inRect(x, y, R[i], z)) || covers.some(z => inRect(x, y, R[i], z))) continue; // open leaf only
        let room = Infinity;
        for (let j = 0; j < n && room > best; j++) if (j !== i && !leaving[j] && R[j] > 0) room = Math.min(room, Math.hypot(toX[j] - x, toY[j] - y) - R[j] - R[i]);
        if (room > best) { best = room; bx = x; by = y; }
      }
      leaving[i] = 0;
      if (best === -Infinity) continue;
      toX[i] = bx; toY[i] = by;
      drift.push({ i, x0: X[i], y0: Y[i], x1: bx, y1: by });
    }
    return drift.length;
  }
  function driftStep(steps) { // returns whether there is more to do
    driftT += steps;
    const u = Math.min(1, driftT / DRIFT), e = u * u * (3 - 2 * u);
    drift = drift.filter(d => clock[d.i] >= REST); // a drop the mouse or the app has touched goes back to ordinary physics
    for (const d of drift) { X[d.i] = d.x0 + (d.x1 - d.x0) * e; Y[d.i] = d.y0 + (d.y1 - d.y0) * e; }
    if (u >= 1) drift = [];
    return drift.length > 0;
  }
  const within = new Uint8Array(n), easing = new Float64Array(n), hull = new Int32Array(n), HX = new Float64Array(n), HY = new Float64Array(n);
  const inZone = (i, z) => X[i] + R[i] > z.x0 && X[i] - R[i] < z.x1 && Y[i] + R[i] > z.y0 && Y[i] - R[i] < z.y1;

  function exitFrom(i, z, bounds) { // the nearest side of a box that leaves the drop on screen: [room, distance, x, y], or null
    const sides = [[z.x0 - R[i] - bounds.l, X[i] - z.x0 + R[i], -1, 0], [bounds.r - z.x1 - R[i], z.x1 - X[i] + R[i], 1, 0], [z.y0 - R[i] - bounds.t, Y[i] - z.y0 + R[i], 0, -1], [bounds.b - z.y1 - R[i], z.y1 - Y[i] + R[i], 0, 1]];
    let way = null;
    for (const side of sides) if (side[0] >= 0 && (!way || side[1] < way[1])) way = side;
    return way;
  }
  // Text landing on a drop, as a hull meets a bubble on water: pushed out by the nearest side and fanned away from the middle like a bow wave.
  // The push builds over half a second, then quadratic drag turns it into the long glide. Big drops are heavier.
  function launch(i, z, bounds) {
    const way = exitFrom(i, z, bounds), cx = (z.x0 + z.x1) / 2, cy = (z.y0 + z.y1) / 2, fan = (d, half) => 0.4 * Math.max(-1, Math.min(1, d / Math.max(1, half)));
    const ux = way ? way[2] || fan(X[i] - cx, (z.x1 - z.x0) / 2) : X[i] - cx, uy = way ? way[3] || fan(Y[i] - cy, (z.y1 - z.y0) / 2) : Y[i] - cy, len = Math.max(0.01, Math.hypot(ux, uy));
    const a = VHULL * (1.6 / (bounds.s || 1.6)) * Math.min(1, LIGHT[i] / 2.5) / HULL / len;
    HX[i] = ux * a; HY[i] = uy * a; hull[i] = HULL;
    splashes.push({ x: X[i], y: Y[i], r: R[i] });
  }

  // Text boxes and panels drops should ease out of, {x0, y0, x1, y1}. Only a drop newly caught inside one starts the 102 s,
  // so a box that keeps changing, or a drop with nowhere to go, can never keep them moving. Returns whether they woke.
  // With hullBounds, a newly caught drop also gets a splash, unless it has only just been pushed by anything, so the mouse keeps priority.
  function setZones(next, hullBounds) {
    const before = zones;
    zones = next;
    const deep = (i, z) => X[i] + R[i] - DEEP > z.x0 && X[i] - R[i] + DEEP < z.x1 && Y[i] + R[i] - DEEP > z.y0 && Y[i] - R[i] + DEEP < z.y1;
    let woke = false;
    for (let i = 0; i < n; i++) {
      // A real overlap, so a box shifting a little does not wake a drop resting just clear of it.
      const caught = zones.find(z => deep(i, z));
      if (caught && !within[i]) { if (hullBounds && clock[i] > HULL_AGAIN && !before.some(z => deep(i, z))) launch(i, caught, hullBounds); woke = true; clock[i] = 0; } // text already there did not land: the drop glided under it
      within[i] = caught ? 1 : 0;
    }
    return woke;
  }
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  // A drop pushed fully off the window is gone. It comes back from a different edge, where there is the most free room,
  // with the same long glide as any other push.
  function respawn(i, exit, bounds, k) {
    const out = R[i] * 1.5, into = R[i] * 2.5;
    let best = -Infinity, edge = 0, along = 0;
    for (let e = 0; e < 4; e++) {
      if (e === exit) continue;
      for (let c = 0; c < 12; c++) {
        const a = 0.1 + 0.8 * (c + random()) / 12; // away from the corners, where it would slide along the edge and out again
        const x = e === 0 ? bounds.l + into : e === 1 ? bounds.r - into : bounds.l + a * (bounds.r - bounds.l);
        const y = e === 2 ? bounds.t + into : e === 3 ? bounds.b - into : bounds.t + a * (bounds.b - bounds.t);
        let room = Infinity;
        for (let j = 0; j < n; j++) if (j !== i) room = Math.min(room, Math.hypot(X[j] - x, Y[j] - y) - R[j] - R[i]);
        for (const z of zones) if (x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1) room -= 1e4; // not into a text box
        if (room > best) { best = room; edge = e; along = a; }
      }
    }
    X[i] = edge === 0 ? bounds.l - out : edge === 1 ? bounds.r + out : bounds.l + along * (bounds.r - bounds.l);
    Y[i] = edge === 2 ? bounds.t - out : edge === 3 ? bounds.b + out : bounds.t + along * (bounds.b - bounds.t);
    const speed = ENTER * k, drift = (random() - 0.5) * 0.2 * k;
    VX[i] = edge === 0 ? speed : edge === 1 ? -speed : drift;
    VY[i] = edge === 2 ? speed : edge === 3 ? -speed : drift;
    inside[i] = 2; // on its way in
    hull[i] = 0;
    for (const key of painted.keys()) if (Math.floor(key / n) === i || key % n === i) painted.delete(key);
    clock[i] = 0;
  }

  function contacts(vapp) {
    head.fill(-1);
    for (let i = 0; i < n; i++) {
      const c = Math.max(0, Math.min(cols - 1, Math.floor((X[i] + 600) / CELL))) + Math.max(0, Math.min(rows - 1, Math.floor((Y[i] + 600) / CELL))) * cols;
      next[i] = head[c]; head[c] = i;
    }
    const nudge = (i, ax, ay, other) => { // a touch never raises a drop past the app's gentle speed
      if (clock[i] >= REST) { // a drop at rest only wakes to a real knock
        if (Math.hypot(VX[other], VY[other]) < 0.05) return;
        clock[i] = 0;
      }
      const before = Math.hypot(VX[i], VY[i]);
      VX[i] += ax; VY[i] += ay;
      const limit = Math.max(before, vapp), now = Math.hypot(VX[i], VY[i]);
      if (now > limit) { VX[i] *= limit / now; VY[i] *= limit / now; }
    };
    const moves = i => VX[i] * VX[i] + VY[i] * VY[i] > STILL * STILL;
    for (let i = 0; i < n; i++) {
      if (!moves(i)) continue; // only a moving drop touches anything; a pair that both move is handled once
      const cx = Math.max(0, Math.min(cols - 1, Math.floor((X[i] + 600) / CELL))), cy = Math.max(0, Math.min(rows - 1, Math.floor((Y[i] + 600) / CELL)));
      for (let gy = Math.max(0, cy - 1); gy <= Math.min(rows - 1, cy + 1); gy++)
        for (let gx = Math.max(0, cx - 1); gx <= Math.min(cols - 1, cx + 1); gx++)
          for (let j = head[gx + gy * cols]; j >= 0; j = next[j]) {
            if (j === i || (j < i && moves(j))) continue;
            const a = Math.min(i, j), b = Math.max(i, j), dx = X[b] - X[a], dy = Y[b] - Y[a], d = Math.max(0.01, Math.hypot(dx, dy));
            let overlap = R[a] + R[b] - d;
            if (overlap <= 0) { painted.delete(a * n + b); continue; }
            const base = painted.get(a * n + b);
            if (base !== undefined) { if (overlap < base) painted.set(a * n + b, overlap); overlap -= base; }
            if (overlap <= 0) continue;
            const f = Math.min(0.01, 0.002 * overlap), ma = R[a] ** 3, mb = R[b] ** 3, sa = 2 * mb / (ma + mb), sb = 2 * ma / (ma + mb);
            nudge(a, -dx / d * f * sa, -dy / d * f * sa, b); nudge(b, dx / d * f * sb, dy / d * f * sb, a);
          }
    }
  }

  // mouse: {x, y, vx, vy, power 0..1}. shapes: moving parts of the app, {x0, y0, x1, y1, vx, vy}. bounds: {l, t, r, b, s}, the window and the leaf's scale.
  // No shape is ever a wall: it only adds a soft push while it moves, so a drop can always pass through it.
  function step(mouse, shapes, bounds) {
    const k = 1.6 / (bounds.s || 1.6), vmax = VMAX * k, vapp = VAPP * k;
    const known = mouse && mouse.x > -1e5, stirring = known && mouse.power > 0.02;
    for (let i = 0; i < n; i++) {
      let near = 0; // how much the cursor claims this drop, moving or parked: the mouse has priority over the app
      if (known) {
        const dx = X[i] - mouse.x, dy = Y[i] - mouse.y, d = Math.max(0.01, Math.hypot(dx, dy)), gap = Math.max(0, d - R[i]);
        if (gap < RANGE) {
          near = 1 - gap / RANGE;
          if (stirring) {
            const f = MOUSE * k * LIGHT[i] * mouse.power * near * near;
            VX[i] += dx / d * f + mouse.vx * f * 0.01; VY[i] += dy / d * f + mouse.vy * f * 0.01;
            clock[i] = -1;
            hull[i] = 0; // the mouse takes over from a splash at once
          }
        }
      }
      // Nested elements are often the same text: only the strongest shape in reach pushes, so they never add up.
      let best = 0, bx = 0, by = 0;
      if (Math.hypot(VX[i], VY[i]) < vapp && near < 1) for (const s of shapes) {
        const nx = Math.max(s.x0, Math.min(s.x1, X[i])), ny = Math.max(s.y0, Math.min(s.y1, Y[i])), dist = Math.hypot(X[i] - nx, Y[i] - ny), reach = MARGIN + R[i];
        if (dist >= reach) continue;
        const f = APP * k * LIGHT[i] * (1 - dist / reach), side = (X[i] - (s.x0 + s.x1) / 2) * -s.vy + (Y[i] - (s.y0 + s.y1) / 2) * s.vx >= 0 ? 1 : -1; // and aside, out of its way
        const ax = (s.vx - s.vy * side * 0.5) * f, ay = (s.vy + s.vx * side * 0.5) * f, strength = ax * ax + ay * ay;
        if (strength > best) { best = strength; bx = ax; by = ay; } // a still shape has zero strength: a still app pushes nothing
      }
      if (best > 0) {
        VX[i] += bx * (1 - near); VY[i] += by * (1 - near);
        const over = Math.hypot(VX[i], VY[i]) / vapp;
        if (over > 1) { VX[i] /= over; VY[i] /= over; }
        clock[i] = -1;
      }
    }
    for (const s of shapes) { s.x0 += s.vx; s.x1 += s.vx; s.y0 += s.vy; s.y1 += s.vy; }
    let any = false;
    for (let i = 0; i < n; i++) {
      if (clock[i] >= REST) continue;
      if (++clock[i] >= REST) { VX[i] = 0; VY[i] = 0; } else any = true; // exactly at rest, 102 s after its last push
    }
    if (!any) return;
    contacts(vapp);
    // Ease out of any text box by its nearest side that stays on screen. No wall: the mouse can still push a drop back through.
    if (zones.length) for (let i = 0; i < n; i++) {
      if (clock[i] >= REST) continue;
      let held = false;
      for (const z of zones) {
        if (!inZone(i, z)) continue;
        held = true;
        const way = exitFrom(i, z, bounds);
        if (!way || way[1] > LONG) { // a long way out from under the text: it shrinks 10% every 2 s as it goes, and past the tiniest size it pops
          R[i] *= SHRINK; LIGHT[i] = lightness(R[i]);
          if (R[i] < TINY) { pop(i); break; }
        }
        if (!way) break; // nowhere to go
        easing[i] = Math.min(1, easing[i] + 1 / RAMP);
        const ramp = easing[i]; // starts from nothing and builds over 2 s, so a box appearing never jolts a drop
        if (Math.hypot(VX[i], VY[i]) >= VZONE * k * ramp) break; // only ever adds a little speed, and never brakes a drop already moving
        let cursor = 0;
        if (known) cursor = Math.max(0, 1 - Math.max(0, Math.hypot(X[i] - mouse.x, Y[i] - mouse.y) - R[i]) / RANGE);
        const f = ZONE * k * LIGHT[i] * (1 - cursor) * ramp;
        VX[i] += way[2] * f; VY[i] += way[3] * f;
        break;
      }
      if (!held) easing[i] = 0;
    }
    for (let i = 0; i < n; i++) {
      if (clock[i] >= REST) continue;
      if (hull[i]) { hull[i]--; VX[i] += HX[i]; VY[i] += HY[i]; }
      const left = 1 - clock[i] / REST, cap = vmax * left * left; // smooth to the end, no visible stop
      let v = Math.hypot(VX[i], VY[i]);
      const slow = Math.min(1 - DRAG * v / k, v > cap ? cap / v : 1);
      VX[i] *= slow; VY[i] *= slow; v *= slow;
      if (inside[i] === 1) { // more than 60% past the window's edge: it goes the rest of the way, whatever its speed, and comes back elsewhere
        const dl = bounds.l - X[i], dr = X[i] - bounds.r, dt = bounds.t - Y[i], db = Y[i] - bounds.b, far = Math.max(dl, dr, dt, db);
        if (far > 0.2 * R[i]) {
          X[i] += far === dl ? -LEAVE * k : far === dr ? LEAVE * k : 0; Y[i] += far === dt ? -LEAVE * k : far === db ? LEAVE * k : 0;
          clock[i] = Math.min(clock[i], REST - 300); // it finishes leaving before it rests
          const edgeGap = R[i] * 1.5 + 2;
          if (far > edgeGap) { respawn(i, far === dl ? 0 : far === dr ? 1 : far === dt ? 2 : 3, bounds, k); }
          continue;
        }
      }
      if (v > STILL) for (const b of borders) { // a window's edge is only a little harder to cross
        const r = R[i], rowOn = Y[i] > b.y0 - r && Y[i] < b.y1 + r, columnOn = X[i] > b.x0 - r && X[i] < b.x1 + r;
        if ((rowOn && (Math.abs(X[i] - b.x0) < r || Math.abs(X[i] - b.x1) < r)) || (columnOn && (Math.abs(Y[i] - b.y0) < r || Math.abs(Y[i] - b.y1) < r))) { VX[i] *= EDGE; VY[i] *= EDGE; v *= EDGE; break; }
      }
      if (v <= STILL) continue;
      X[i] += VX[i]; Y[i] += VY[i];
      if (X[i] > bounds.l && X[i] < bounds.r && Y[i] > bounds.t && Y[i] < bounds.b) inside[i] = 1;
      if (!inside[i]) continue; // a drop the window's crop has always hidden stays out of view, it is not pulled in
      const gone = R[i] * 1.5 + 2; // shadow included
      const exit = X[i] < bounds.l - gone ? 0 : X[i] > bounds.r + gone ? 1 : Y[i] < bounds.t - gone ? 2 : Y[i] > bounds.b + gone ? 3 : -1;
      if (exit >= 0) respawn(i, exit, bounds, k);
    }
  }

  return { X, Y, VX, VY, R, REST, VMAX, VAPP, VZONE, step, setZones, setBorders: next => { borders = next; }, setCovers: next => { covers = next; }, planDrift, driftStep, DRIFT, revive, takePops: () => { const p = pops; pops = []; return p; }, takeSplashes: () => { const p = splashes; splashes = []; return p; }, awake: () => clock.some(c => c < REST) };
}

// Zen Click: the start-up card's scale and bell, one bell per click. A click while another still rings takes a note that sounds well with it (never a second or a seventh).
const BELL_SCALE = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3], BELL_SWEET = [6 / 5, 5 / 4, 4 / 3, 3 / 2, 8 / 5, 5 / 3, 2, 5 / 2, 8 / 3, 3];
function technozenBellNote(last, ringing, rnd) {
  const sweet = (a, b) => { const r = Math.max(a, b) / Math.min(a, b); return BELL_SWEET.some(x => Math.abs(x - r) < 0.001); };
  const notes = BELL_SCALE.map((_, i) => i).filter(i => i !== last && (!ringing || sweet(BELL_SCALE[i], BELL_SCALE[last])));
  return notes[Math.floor(rnd() * notes.length)];
}
// level 0..1 sets both loudness and length. Returns ring(level, time, together), which returns when the last bell ends. together makes a beat however long ago the last bell rang.
// A lone bell is the same in both ears. A second click while it rings makes a true binaural beat: 4 to 7 Hz between the ears in the new bell,
// the ringing bell's right ear glides to the same split, and both last 35% longer. Left and right never mix, so the beat exists only in the listener's head.
function technozenBells(ctx) {
  const RATIO = [1, 2, 2.76, 4.07], AMP = [1, 0.5, 0.25, 0.12], TAU = [2, 1.4, 0.9, 0.6], LONGER = 1.35, MAX = 12, base = 180 + Math.random() * 40;
  const out = ctx.createDynamicsCompressor(); // many clicks at once must never distort
  out.threshold.value = -9; out.knee.value = 6; out.ratio.value = 20; out.attack.value = 0.002; out.release.value = 0.25;
  const trim = ctx.createGain(); trim.gain.value = 0.9; // the compressor can overshoot a little on a sudden hit
  out.connect(trim); trim.connect(ctx.destination);
  let last = -1, ringsUntil = -1e9, rung = [];
  const stopAt = (b, t) => { b.end = t; for (const p of b.parts) { p.l.stop(t); p.r.stop(t); } };
  const fade = (b, t, length) => { b.parts.forEach((p, k) => { p.gain.gain.cancelAndHoldAtTime(t); p.gain.gain.setTargetAtTime(0, t, TAU[k] * length); }); };
  return (level, t, together) => {
    const ringing = together || t < ringsUntil, note = technozenBellNote(last, ringing, Math.random), beat = ringing ? 4 + Math.random() * 3 : 0;
    const f = base * BELL_SCALE[note], loud = (0.02 + 0.6 * level * level) / 1.87, length = (0.4 + 1.2 * level) * (ringing ? LONGER : 1);
    rung = rung.filter(b => b.end > t);
    if (ringing) for (const b of rung) if (!b.split) {
      b.split = true; b.length *= LONGER;
      b.parts.forEach((p, k) => p.r.frequency.setTargetAtTime(b.f * RATIO[k] + beat, t, 0.05));
      fade(b, t, b.length); stopAt(b, t + 6 * 2 * b.length);
    }
    if (rung.length >= MAX) { const b = rung.shift(); fade(b, t, 0.02 / 2); stopAt(b, t + 0.1); }
    const b = { f, split: ringing, length, end: 0, parts: RATIO.map((ratio, k) => {
      const l = ctx.createOscillator(), r = ctx.createOscillator(), join = ctx.createChannelMerger(2), gain = ctx.createGain();
      l.frequency.value = f * ratio; r.frequency.value = f * ratio + beat;
      l.connect(join, 0, 0); r.connect(join, 0, 1); join.connect(gain); gain.connect(out);
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(AMP[k] * loud, t + 0.015); gain.gain.setTargetAtTime(0, t + 0.015, TAU[k] * length);
      l.start(t); r.start(t);
      return { l, r, gain };
    }) };
    stopAt(b, t + 6 * 2 * length);
    rung.push(b); last = note; ringsUntil = Math.max(ringsUntil, t + 4.6 * length); // until it is 20 dB down
    return Math.max(...rung.map(x => x.end));
  };
}

// The mindfulness bell. Seconds between a double bell's two bells, close together to lengthily apart. "random" or "0" to "4".
const BELL_GAPS = [0.12, 0.35, 0.9, 2.2, 5];
const technozenBellGap = (gap, rnd) => BELL_GAPS[gap === "random" ? Math.floor(rnd() * BELL_GAPS.length) : Number(gap)];
// mind: {every: minutes or 0, next: ms, zen: "off" | "random" | "daily", at: "HH:MM", gap, done: which daily bell has rung}. Returns null or {gap}, gap only on a double bell.
// A bell more than 2 minutes late is skipped, so a PC waking from sleep does not ring one for the hours it missed.
function technozenMindDue(mind, now, rnd) {
  const LATE = 120000, ms = now.getTime();
  let bell = null;
  if (mind.every > 0 && ms >= mind.next) {
    const onTime = ms - mind.next < LATE;
    if (onTime) bell = mind.zen === "random" && rnd() < 0.2 ? { gap: technozenBellGap(mind.gap, rnd) } : {};
    mind.next = (onTime ? mind.next : ms) + mind.every * 60000; // from when it was due, so a late tick never pushes the rest back
  }
  if (mind.zen === "daily") {
    const [h, m] = mind.at.split(":").map(Number), at = new Date(now), key = now.toDateString() + " " + mind.at;
    at.setHours(h, m, 0, 0);
    if (ms >= at.getTime() && ms - at.getTime() < LATE && mind.done !== key) { mind.done = key; bell = { gap: technozenBellGap(mind.gap, rnd) }; } // shortcut: a bell at 23:59 delayed past midnight is missed, at most once and only if the page is throttled
  }
  return bell;
}

  let splashOn = false, rippleOn = true, zenOn = false, bellLevel = 0.5; // the panel's choices, kept current by sync()
  const mind = { every: 0, next: 0, zen: "off", at: "09:00", gap: "random", done: "" };
  const style = document.getElementById("technozen") || Object.assign(document.createElement("style"), { id: "technozen" });

  function apply(slug) {
    if (!THEMES[slug]) slug = ORDER[0];
    if (style.textContent !== CSS[slug]) style.textContent = CSS[slug];
    document.head.appendChild(style); // (re-)append so it stays after the app's own stylesheets
    if (!html.dataset.technozen) style.dataset.appMode = html.dataset.mode || ""; // the app's own light/dark, for remove()
    html.dataset.technozen = slug;
    html.dataset.mode = THEMES[slug].mode; // a few non-variable rules (icons, scrollbars) key off data-mode
    localStorage.setItem("technozen", slug);
    sync();
  }

  // The skin (shapes, gloss, backgrounds) sits on top of the colors and can be turned off.
  function skin(on) {
    html.dataset.technozenSkin = on ? "on" : "off";
    localStorage.setItem("technozen-skin", html.dataset.technozenSkin);
    sync();
  }

  // Zen Click: nothing runs and no sound device is held until a click, and the sound device is let go when the last bell has ended.
  let ring = null, hush = 0, ringEnd = 0;
  function bell(gap) { // gap, in seconds, makes it a double bell
    const ctx = window.technozenAudio || (window.technozenAudio = new AudioContext()), asked = performance.now();
    ring = ring || technozenBells(ctx);
    ctx.resume().then(() => {
      if (performance.now() - asked > 1000 || ctx !== window.technozenAudio) return; // sound not allowed yet: a bell must not sound late, on the next click
      const t = ctx.currentTime + 0.005;
      ringEnd = ring(bellLevel, t);
      if (gap !== undefined) ringEnd = ring(bellLevel, t + gap, true);
      clearTimeout(hush); hush = setTimeout(() => ctx.suspend(), (ringEnd - ctx.currentTime) * 1000 + 200);
    });
  }
  function mindTick() {
    const due = technozenMindDue(mind, new Date(), Math.random);
    if (!due) return;
    localStorage.setItem("technozen-mind-done", mind.done);
    bell(due.gap);
  }
  if (window.technozenClick) for (const type of ["pointerdown", "mousedown"]) removeEventListener(type, window.technozenClick, true);
  // A second button pressed while another is held fires no pointerdown, only mousedown. The slider rings when let go instead, at its new setting.
  window.technozenClick = e => { if (zenOn && (e.type === "pointerdown" || e.buttons & (e.buttons - 1)) && !(e.target.closest && e.target.closest(".tz-bell"))) bell(); };
  for (const type of ["pointerdown", "mousedown"]) addEventListener(type, window.technozenClick, true);

  function remove() {
    const ours = THEMES[html.dataset.technozen];
    stopDrops();
    zenOn = false; clearTimeout(hush); clearInterval(window.technozenMindTimer);
    if (window.technozenAudio) { // what is ringing rings out, as it does when the start-up card closes
      const ctx = window.technozenAudio;
      setTimeout(() => ctx.close(), Math.max(0, ringEnd - ctx.currentTime) * 1000 + 200);
      window.technozenAudio = null; ring = null;
    }
    style.remove();
    panel.remove();
    delete html.dataset.technozen;
    delete html.dataset.technozenSkin;
    // Put the app's mode back, unless the app changed it itself while the theme was on.
    if (ours && html.dataset.mode === ours.mode && style.dataset.appMode) html.dataset.mode = style.dataset.appMode;
    localStorage.removeItem("technozen");
  }

  // Live drops: a canvas behind the app, driven by technozenWorld. Everything it starts, stopDrops ends.
  function stopDrops() { if (window.technozenDropsStop) window.technozenDropsStop(); }
  function startDrops() { if (!window.technozenDropsStop) runDrops().catch(e => { console.warn("[technozen] drops stay painted on the leaf:", e); stopDrops(); }); }

  async function runDrops() {
    let alive = true, raf = 0, timer = 0, resizeTimer = 0, scanTimer = 0, zoneTimer = 0, zoneIdle = 0, zonesStale = false, driftTimer = 0, driftTick = 0, busyAt = 0, restless = true, last = 0, spare = 0, activeUntil = 0, lastSample = 0, scrolledAt = -1e9;
    const off = new AbortController(), on = { passive: true, capture: true, signal: off.signal };
    const canvas = Object.assign(document.createElement("canvas"), { id: "technozen-drops" });
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
    const ctx = canvas.getContext("2d");
    const world = technozenWorld(DROPS.drops, DROPS.w, DROPS.h);
    const mouse = { x: -1e6, y: -1e6, vx: 0, vy: 0, power: 0 };
    let shapes = [], s = 1, ox = 0, oy = 0, dpr = 1, mx = 0, my = 0, mt = 0;
    const bounds = { l: 0, t: 0, r: 0, b: 0, s: 1 }, drawnX = new Float64Array(DROPS.drops.length), drawnY = new Float64Array(DROPS.drops.length), drawnR = new Float64Array(DROPS.drops.length);
    let bursts = [], ripples = [], zonesKnown = false; const returning = new Set(), revivals = new Set();
    let io, mo, ro;
    window.technozenDropsStop = () => {
      alive = false; off.abort(); cancelAnimationFrame(raf); clearTimeout(timer); clearTimeout(resizeTimer); clearTimeout(scanTimer); clearTimeout(driftTimer); clearInterval(driftTick); revivals.forEach(clearTimeout); clearTimeout(zoneTimer);
      if (io) io.disconnect(); if (mo) mo.disconnect(); if (ro) ro.disconnect();
      canvas.remove(); delete html.dataset.technozenInteractive; window.technozenDropsStop = null;
    };

    // Every drop on one sheet, drawn by the browser from the same shape and gradients as the painted leaf.
    let ax = 2, ay = 2, rowH = 0;
    const cells = DROPS.drops.map(d => {
      const w = Math.ceil(d[2] * 2.8), h = Math.ceil(d[3] * 2.8);
      if (ax + w > 1400) { ax = 2; ay += rowH + 2; rowH = 0; }
      const cell = { x: ax, y: ay, w, h, left: d[2] * 1.25, top: d[3] * 1.25 };
      ax += w + 2; rowH = Math.max(rowH, h);
      return cell;
    });
    const sheetH = ay + rowH + 2;
    const uses = DROPS.drops.map((d, i) => `<use href='#d' transform='translate(${cells[i].x + cells[i].left} ${cells[i].y + cells[i].top})scale(${d[2]} ${d[3]})' stroke-width='${d[4]}'/>`).join("");
    const image = new Image();
    image.src = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='${sheetH}' viewBox='0 0 1400 ${sheetH}'><defs>${DROPS.defs}</defs>${uses}</svg>`);
    await image.decode();
    if (!alive) return;
    const sheet = document.createElement("canvas");

    function fit() { // the leaf's own center / cover scaling, so a drop sits exactly where it was painted
      const vw = innerWidth, vh = innerHeight;
      s = Math.max(vw / DROPS.w, vh / DROPS.h); ox = (vw - DROPS.w * s) / 2; oy = (vh - DROPS.h * s) / 2; dpr = devicePixelRatio || 1;
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      bounds.l = -ox / s; bounds.t = -oy / s; bounds.r = (vw - ox) / s; bounds.b = (vh - oy) / s; bounds.s = s;
    }
    function rasterize() {
      sheet.width = Math.ceil(1400 * s * dpr); sheet.height = Math.ceil(sheetH * s * dpr);
      sheet.getContext("2d").drawImage(image, 0, 0, sheet.width, sheet.height);
    }
    function draw() {
      const k = s * dpr, sx = sheet.width / 1400, sy = sheet.height / sheetH, ahead = spare * 60;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i], x = world.X[i] + world.VX[i] * ahead, y = world.Y[i] + world.VY[i] * ahead; // carried on past the 60 Hz step to this exact moment
        const size = world.R[i] / DROPS.drops[i][2];
        drawnX[i] = x; drawnY[i] = y; drawnR[i] = world.R[i];
        if (size) ctx.drawImage(sheet, c.x * sx, c.y * sy, c.w * sx, c.h * sy, (ox + (x - c.left * size) * s) * dpr, (oy + (y - c.top * size) * s) * dpr, c.w * k * size, c.h * k * size);
      }
      const now = performance.now();
      bursts = bursts.filter(b => now - b.t < 350);
      for (const b of bursts) { // a pop: a thin ring opening and a few specks flying off, gone in a third of a second
        const u = (now - b.t) / 350, x = (ox + b.x * s) * dpr, y = (oy + b.y * s) * dpr, reach = (4 + 18 * u) * s * dpr;
        ctx.globalAlpha = 1 - u; ctx.strokeStyle = ctx.fillStyle = "#fff"; ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath(); ctx.arc(x, y, reach, 0, 6.3); ctx.stroke();
        for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.arc(x + Math.cos(a * 1.05) * reach * 1.3, y + Math.sin(a * 1.05) * reach * 1.3, 1.1 * dpr, 0, 6.3); ctx.fill(); }
      }
      ripples = ripples.filter(r => now - r.t < 1400);
      for (const r of ripples) for (let w = 0; w < 3; w++) { // rings leaving a splash one after another, slowing as they spread: a light crest with a dark trough behind it
        const u = (now - r.t - w * 200) / (1400 - w * 200);
        if (u <= 0) continue;
        const reach = (r.r + 70 * (1 - (1 - u) * (1 - u))) * s * dpr, x = (ox + r.x * s) * dpr, y = (oy + r.y * s) * dpr, fade = (1 - u) * (1 - u);
        ctx.lineWidth = 1.2 * dpr;
        ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, reach, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 0.25 * fade; ctx.strokeStyle = "#032"; ctx.beginPath(); ctx.arc(x, y, reach + 1.5 * dpr, 0, 6.3); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      raf = 0;
      if (!alive) return;
      spare = Math.min(spare + (now - last) / 1000, 4 / 60); last = now;
      for (; spare >= 1 / 60; spare -= 1 / 60) { world.step(mouse, shapes, bounds); mouse.power *= 0.9; }
      for (const p of world.takePops()) {
        const i = world.R.findIndex((r, j) => r === 0 && !returning.has(j));
        bursts.push({ x: p.x, y: p.y, t: now });
        if (i >= 0) { // a new drop comes in from outside within 5 minutes
          const back = setTimeout(() => { returning.delete(i); revivals.delete(back); if (alive) { world.revive(i, bounds); wake(); } }, 30000 + Math.random() * 270000);
          returning.add(i); revivals.add(back);
        }
      }
      for (const p of world.takeSplashes()) if (rippleOn) ripples.push({ x: p.x, y: p.y, r: p.r, t: now });
      if (bursts.length || ripples.length) draw(); else drawIfMoved();
      if (world.awake() || mouse.power > 0.02 || shapes.length || bursts.length || ripples.length) raf = requestAnimationFrame(frame);
      else if (restless && !driftTick) { clearTimeout(driftTimer); driftTimer = setTimeout(beginDrift, 5000); }
    }
    function drawIfMoved() { // a glide moving a fraction of a pixel costs no drawing
      let moved = 0;
      const ahead = spare * 60;
      for (let i = 0; i < cells.length; i++) moved = Math.max(moved, Math.abs(world.X[i] + world.VX[i] * ahead - drawnX[i]), Math.abs(world.Y[i] + world.VY[i] * ahead - drawnY[i]), Math.abs(world.R[i] - drawnR[i]));
      if (moved * s * dpr > 0.25) draw();
    }
    function wake() { clearTimeout(driftTimer); restless = true; if (alive && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    // Once everything has rested for 5 s, most of the drops wander into the empty space too slowly to see. It stands still whenever Claude is busy or hidden, and costs nothing once done.
    function beginDrift() {
      if (!alive || driftTick || world.awake() || !canvas.isConnected) return;
      restless = false;
      if (world.planDrift(bounds)) driftTick = setInterval(() => {
        if (document.hidden || performance.now() - busyAt < 1500) return;
        if (!world.driftStep(7.5)) { clearInterval(driftTick); driftTick = 0; }
        if (!raf) drawIfMoved();
      }, 125);
    }

    // Only the windows the text sits in push, and only when they themselves move or resize: never the text, never scrolling.
    const SELECTOR = "main,nav,aside,.dframe-sidebar,.dframe-content,.dframe-pane,.dframe-card,[data-cds=Panel],[data-cds=Dialog],[role=dialog],[data-cds-popup],[data-cds=Menu],[data-cds=Popover],[data-cds=ChatComposer]";
    const onScreen = new Set(), rects = new WeakMap();
    const watch = el => { if (!panel.contains(el)) { io.observe(el); ro.observe(el); } };
    io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) onScreen.add(e.target);
        else { onScreen.delete(e.target); rects.delete(e.target); if (!e.target.isConnected) io.unobserve(e.target); }
      }
      schedule();
    });
    function schedule() { if (alive && !timer && !document.hidden) timer = setTimeout(sample, 100); }
    function stirUp() { activeUntil = performance.now() + 1000; schedule(); } // measuring stops 1 s after the last sign of change, whatever is still animating
    function sample() {
      timer = 0;
      const now = performance.now(), gap = now - lastSample, dt = Math.min(0.3, Math.max(0.05, gap / 1000)); lastSample = now;
      const stale = gap > 500 || now - scrolledAt < 250; // after a pause the old positions say nothing about speed, and a scroll moves only content
      const moving = [], toWorld = 1 / (s * dt * 60), clip = v => Math.max(-3, Math.min(3, v));
      for (const el of onScreen) {
        if (!el.isConnected) { onScreen.delete(el); continue; }
        const r = el.getBoundingClientRect(), p = rects.get(el);
        rects.set(el, [r.left, r.top, r.right, r.bottom]);
        let dx = 0, dy = 0;
        if (p && !stale) { dx = (r.left - p[0] + r.right - p[2]) / 2; dy = (r.top - p[1] + r.bottom - p[3]) / 2; }
        if (Math.abs(dx) + Math.abs(dy) < 0.5 || moving.length >= 300) continue;
        if (el.getAnimations().some(a => a.effect && a.effect.getTiming().iterations === Infinity)) continue; // a spinner is not a push
        moving.push({ x0: (r.left - ox) / s, y0: (r.top - oy) / s, x1: (r.right - ox) / s, y1: (r.bottom - oy) / s, vx: clip(dx * toWorld), vy: clip(dy * toWorld) });
      }
      shapes = moving;
      if (moving.length) wake();
      if (now < activeUntil) schedule(); else shapes = [];
    }
    // Text sitting directly on the leaf, which drops ease away from. Found by probing a grid of points, so a huge transcript costs the same
    // as a small one, and only once the page has been quiet for a second, so nothing runs while Claude is busy loading a chat.
    const TEXT = "p,li,pre,h1,h2,h3,h4,blockquote,table";
    const ownText = el => { for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; };
    // Inside anything with a visible background the text has its own cover, so drops may rest under it. The chat column's faint wash is not a window.
    function isCovered(el, memo) {
      for (let n = el; n && n !== document.body && !n.matches("main"); n = n.parentElement) {
        let solid = memo.get(n);
        if (solid === undefined) {
          const c = getComputedStyle(n);
          solid = !/^(transparent|rgba\(\d+, \d+, \d+, 0\))$/.test(c.backgroundColor) || c.backgroundImage !== "none" || c.backdropFilter !== "none";
          memo.set(n, solid);
        }
        if (solid) return true;
      }
      return false;
    }
    function findZones() {
      zoneTimer = 0;
      if (!alive || !canvas.isConnected) return;
      const hits = new Set(), memo = new Map(), vw = innerWidth, vh = innerHeight, cols = 16, rows = 26;
      let cell = 0;
      const probe = idle => { // a few points at a time, only while Claude has nothing else to do
        zoneIdle = 0;
        if (!alive) return;
        do {
          const row = Math.floor(cell / cols); // two extra rows through the title bar, whose text is too thin and too high for the even grid
          const el = document.elementFromPoint((cell % cols + 0.5) * vw / cols, row < 2 ? 12 + row * 12 : (row - 2 + 0.5) * vh / (rows - 2));
          const box = el && !panel.contains(el) && !el.closest("button,[role=button]") && (el.closest(TEXT) || (ownText(el) ? el : null));
          if (box && !isCovered(box, memo)) hits.add(box);
          cell++;
        } while (cell < cols * rows && idle.timeRemaining() > 1);
        if (cell < cols * rows) { zoneIdle = requestIdleCallback(probe, { timeout: 1000 }); return; }
        const range = document.createRange(), boxes = [], gap = vh * 0.2; // the grid can land between lines, so strips of one column are joined across a few rows
        for (const el of hits) {
          // A short block is one message, whichever of its lines the grid landed on. A long one is a column, joined below.
          const up = el.parentElement, block = up && up !== document.body && !up.matches("main") && !isCovered(up, memo) ? up.getBoundingClientRect() : null;
          range.selectNodeContents(block && block.height <= vh * 0.35 && block.width <= vw * 0.6 ? up : el); // the words themselves, not the width of the pane they sit in
          const r = range.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          let z = { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
          for (let i = boxes.length - 1; i >= 0; i--) { // lines of one column become one box
            const b = boxes[i], sharedWidth = Math.min(z.x1, b.x1) - Math.max(z.x0, b.x0);
            if (sharedWidth > 0.5 * Math.min(z.x1 - z.x0, b.x1 - b.x0) && z.y0 - b.y1 < gap && b.y0 - z.y1 < gap) {
              z = { x0: Math.min(z.x0, b.x0), y0: Math.min(z.y0, b.y0), x1: Math.max(z.x1, b.x1), y1: Math.max(z.y1, b.y1) };
              boxes.splice(i, 1);
            }
          }
          boxes.push(z);
        }
        for (const z of boxes) if (z.y0 < vh * 0.06) z.y0 = -5; // text running up under the top of the window
        const frames = [];
        for (const el of onScreen) if (frames.length < 30 && el.isConnected && !el.matches("main,.dframe-content")) { const r = el.getBoundingClientRect(); frames.push({ x0: (r.left - ox) / s, y0: (r.top - oy) / s, x1: (r.right - ox) / s, y1: (r.bottom - oy) / s }); }
        world.setBorders(frames);
        const covers = [];
        for (const el of onScreen) if (covers.length < 30 && el.isConnected && !el.matches("main") && isCovered(el, memo)) { const r = el.getBoundingClientRect(); covers.push({ x0: (r.left - ox) / s, y0: (r.top - oy) / s, x1: (r.right - ox) / s, y1: (r.bottom - oy) / s }); }
        world.setCovers(covers);
        const woke = world.setZones(boxes.map(z => ({ x0: (z.x0 - ox) / s, y0: (z.y0 - oy) / s, x1: (z.x1 - ox) / s, y1: (z.y1 - oy) / s })), splashOn && zonesKnown ? bounds : null); // the text already there at the start has not landed
        zonesKnown = true;
        if (woke) wake();
        else if (restless && !raf && !driftTick) { clearTimeout(driftTimer); driftTimer = setTimeout(beginDrift, 5000); }
        if (zonesStale) { zonesStale = false; settleZones(300); }
      };
      zoneIdle = requestIdleCallback(probe, { timeout: 1000 });
    }
    function settleZones(wait) { if (zoneTimer || zoneIdle) zonesStale = true; else zoneTimer = setTimeout(findZones, wait); } // a steady beat, so text that keeps moving is still noticed
    ro = new ResizeObserver(stirUp);
    const scan = () => { scanTimer = 0; if (alive) for (const el of document.body.querySelectorAll(SELECTOR)) watch(el); };
    // New windows are noticed at most once a second, with no work per added node, so a chat switch or a streaming reply costs nothing here.
    mo = new MutationObserver(() => { busyAt = performance.now(); if (!scanTimer) scanTimer = setTimeout(scan, 1000); settleZones(splashOn ? 300 : 800); });
    mo.observe(document.body, { childList: true, subtree: true });
    scan();
    addEventListener("scroll", () => { scrolledAt = busyAt = performance.now(); settleZones(splashOn ? 150 : 300); }, on);
    addEventListener("transitionrun", e => { if (e.target.matches && e.target.matches(SELECTOR)) { watch(e.target); stirUp(); } }, on);
    addEventListener("animationstart", e => { if (e.target.matches && e.target.matches(SELECTOR)) { watch(e.target); stirUp(); } }, on);
    document.addEventListener("visibilitychange", () => { stirUp(); settleZones(300); }, { signal: off.signal });
    addEventListener("pointermove", e => {
      const dt = Math.max(1, e.timeStamp - mt), dx = e.clientX - mx, dy = e.clientY - my, first = !mt; // only a moving mouse stirs, so a parked one lets them rest
      mx = e.clientX; my = e.clientY; mt = e.timeStamp;
      mouse.x = (mx - ox) / s; mouse.y = (my - oy) / s;
      if (first) return; // the first event only says where the cursor is
      mouse.vx = Math.max(-20, Math.min(20, dx / s / dt * 16.7)); mouse.vy = Math.max(-20, Math.min(20, dy / s / dt * 16.7));
      mouse.power = Math.max(mouse.power, Math.min(1, Math.hypot(dx, dy) / dt / 0.8));
      wake();
    }, on);
    addEventListener("resize", () => {
      clearTimeout(resizeTimer); stirUp(); settleZones(300);
      if (canvas.isConnected && innerWidth && innerHeight) { fit(); draw(); } // the old sheet stretches for a moment while the window drags
      resizeTimer = setTimeout(reveal, 150);
    }, on);

    // A hidden window can report no size (the helper hides Claude while it pastes): wait for a real one.
    function reveal() {
      if (!alive || !innerWidth || !innerHeight) return;
      fit(); rasterize(); draw();
      if (canvas.isConnected) return;
      html.appendChild(canvas);
      html.dataset.technozenInteractive = "on"; // the painted drops go in the same instant the live ones appear
      settleZones(300);
    }
    reveal();
  }

  // The panel: one swatch per theme, a skin switch, remove, and a fold button. Re-running the
  // snippet reuses the existing panel. Its look comes from the app's own variables, so it fits any theme.
  const panel = document.getElementById("technozen-panel") || Object.assign(document.createElement("div"), { id: "technozen-panel" });
  panel.innerHTML = `<style>
    #technozen-panel { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 999px; font: 13px system-ui, sans-serif; color: var(--cds-text-primary, #222);
      background: var(--cds-surface-popover, #fff); box-shadow: 0 0 0 1px var(--cds-border, #0002), 0 8px 24px #0003; }
    #technozen-panel[data-folded] > :not(.tz-fold) { display: none; }
    #technozen-panel button { all: unset; cursor: pointer; box-sizing: border-box; }
    #technozen-panel .tz-swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--cds-surface-popover, #fff); box-shadow: 0 0 0 1px var(--cds-border, #0003); }
    #technozen-panel .tz-swatch[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--cds-text-primary, #222); }
    #technozen-panel label { display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
    #technozen-panel .tz-live-label[data-off] { opacity: 0.5; cursor: default; }
    #technozen-panel .tz-dis[disabled] { opacity: 0.5; cursor: default; }
    #technozen-panel .tz-menu { inset: auto; margin: 0; padding: 8px 12px; border: 0; border-radius: 12px; color: inherit; font: inherit;
      background: var(--cds-surface-popover, #fff); backdrop-filter: blur(14px); box-shadow: 0 0 0 1px var(--cds-border, #0002), 0 8px 24px #0003; }
    #technozen-panel .tz-menu label { padding: 3px 0; }
    #technozen-panel .tz-sub { padding-left: 20px; }
    #technozen-panel .tz-menu b { display: block; font-weight: 600; margin-top: 6px; } #technozen-panel .tz-menu b:first-child { margin-top: 0; }
    #technozen-panel .tz-menu input:not([type=radio]), #technozen-panel .tz-menu select { font: inherit; color: inherit; background: transparent; border: 1px solid var(--cds-border, #0003); border-radius: 6px; padding: 1px 4px; margin-left: 4px; }
    #technozen-panel .tz-menu input[type=number] { width: 52px; }
    #technozen-panel .tz-menu select option { color: #222; }
    #technozen-panel .tz-menu :disabled { opacity: 0.5; }
    #technozen-panel .tz-sub[data-off] { opacity: 0.5; }
    #technozen-panel .tz-bell { width: 80px; margin: 0; cursor: pointer; }
    #technozen-panel .tz-bell[disabled] { opacity: 0.5; cursor: default; }
    #technozen-panel .tz-remove { padding: 0 6px; opacity: 0.7; } #technozen-panel .tz-remove:hover { opacity: 1; }
    #technozen-panel .tz-fold { width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; background: var(--cds-fill-secondary, #0001); }
  </style>` + ORDER.map(s => `<button class="tz-swatch" data-theme="${s}" title="${THEMES[s].name}" style="background: linear-gradient(135deg, ${THEMES[s].bg} 45%, ${THEMES[s].accent} 55%)"></button>`).join("")
    + `<label title="Full skin on, or colors only"><input type="checkbox" class="tz-skin"> skin</label>`
    + `<label class="tz-live-label"><input type="checkbox" class="tz-live"> interactive</label>`
    + `<button class="tz-dis" popovertarget="tz-disruption" title="What text does when it lands on a drop">text bubble disruption ▴</button>`
    + `<div class="tz-menu" id="tz-disruption" popover><label title="Drops ease slowly out from under text"><input type="radio" name="tz-mode" value="gentle"> Gentle</label><label title="Text landing on a drop pushes it away like a boat hull on water"><input type="radio" name="tz-mode" value="splash"> Splash</label>`
    + `<div class="tz-sub"><label><input type="radio" name="tz-ripple" value="on"> Ripple</label><label><input type="radio" name="tz-ripple" value="off"> No ripple</label></div></div>`
    + `<label title="Every click rings a bell. A click while another still rings makes a binaural beat, best on headphones"><input type="checkbox" class="tz-zen"> Zen Click</label>`
    + `<input type="range" class="tz-bell" min="0" max="100" aria-label="Bell volume and length" title="Bell volume and length">`
    + `<button class="tz-dis" popovertarget="tz-mindful" title="A bell that goes off by itself">mindfulness bell ▴</button>`
    + `<div class="tz-menu" id="tz-mindful" popover><b>Bell</b>`
    + [["off", "Off"], ["30", "30 minutes"], ["60", "1 hour"]].map(o => `<label><input type="radio" name="tz-mind" data-store="mind" value="${o[0]}"> ${o[1]}</label>`).join("")
    + `<label><input type="radio" name="tz-mind" data-store="mind" value="custom"> Custom <input type="number" class="tz-mind-custom" data-store="mind-custom" min="1" max="1440" step="1" aria-label="Minutes between bells"> min</label>`
    + `<b title="A double bell: two close notes that make a binaural beat, best on headphones">Binaural zen</b><label><input type="radio" name="tz-mind-zen" data-store="mind-zen" value="off"> Off</label>`
    + `<label title="About 1 bell in 5 is a double bell"><input type="radio" name="tz-mind-zen" data-store="mind-zen" value="random"> Random</label>`
    + `<label title="A double bell at this time every day"><input type="radio" name="tz-mind-zen" data-store="mind-zen" value="daily"> Daily at <input type="time" class="tz-mind-at" data-store="mind-at" aria-label="Time of the daily double bell"></label>`
    + `<b>Time between the two bells</b><select class="tz-gap" data-store="mind-gap" aria-label="Time between the two bells"><option value="random">Random</option><option value="0">1, very close</option><option value="1">2, close</option><option value="2">3, medium</option><option value="3">4, apart</option><option value="4">5, far apart</option></select></div>`
    + `<button class="tz-remove" title="Remove Technozen (Ctrl+Alt+0)">×</button><button class="tz-fold" title="Fold the panel">◐</button>`;
  if (localStorage.getItem("technozen-panel") === "folded") panel.dataset.folded = "";
  panel.querySelector(".tz-bell").onchange = e => { localStorage.setItem("technozen-bell", e.target.value); sync(); bell(); }; // let go of the slider to hear the new setting
  panel.querySelectorAll(".tz-menu").forEach(menu => { menu.onbeforetoggle = e => { // a drop-up opens above its button
    if (e.newState !== "open") return;
    const r = panel.querySelector(`[popovertarget=${menu.id}]`).getBoundingClientRect();
    menu.style.right = innerWidth - r.right + "px"; menu.style.bottom = innerHeight - r.top + 12 + "px";
  }; });
  panel.querySelectorAll(".tz-mind-custom, .tz-mind-at").forEach(field => { field.onblur = () => { if (!field.value) sync(); }; }); // a field left blank shows its setting again; not sooner, a time being typed is blank for a moment
  panel.onchange = e => {
    const t = e.target;
    if (!t.dataset.store || !t.value) return;
    localStorage.setItem("technozen-" + t.dataset.store, t.value);
    sync();
    if (t.classList.contains("tz-gap") && mind.zen !== "off") bell(technozenBellGap(mind.gap, Math.random)); // hear the new spacing
  };
  panel.onclick = e => {
    const b = e.target.closest("button, input");
    if (!b) return;
    if (b.dataset.theme) apply(b.dataset.theme);
    else if (b.classList.contains("tz-skin")) skin(b.checked);
    else if (b.classList.contains("tz-live")) { localStorage.setItem("technozen-interactive", b.checked ? "on" : "off"); sync(); }
    else if (b.name === "tz-mode") { localStorage.setItem("technozen-disruption", b.value); sync(); }
    else if (b.name === "tz-ripple") { localStorage.setItem("technozen-ripple", b.value); sync(); }
    else if (b.classList.contains("tz-zen")) { localStorage.setItem("technozen-zenclick", b.checked ? "on" : "off"); sync(); }
    else if (b.classList.contains("tz-remove")) remove();
    else if (b.classList.contains("tz-fold")) {
      panel.toggleAttribute("data-folded");
      localStorage.setItem("technozen-panel", panel.hasAttribute("data-folded") ? "folded" : "open");
    }
  };
  function sync() {
    if (!panel.isConnected) document.body.appendChild(panel);
    panel.querySelectorAll(".tz-swatch").forEach(b => b.setAttribute("aria-pressed", b.dataset.theme === html.dataset.technozen));
    panel.querySelector(".tz-skin").checked = html.dataset.technozenSkin === "on";
    const possible = html.dataset.technozen === "take" && html.dataset.technozenSkin === "on";
    const stored = localStorage.getItem("technozen-interactive");
    const wanted = stored ? stored === "on" : !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = panel.querySelector(".tz-live"), label = panel.querySelector(".tz-live-label");
    box.disabled = !possible; box.checked = wanted;
    label.toggleAttribute("data-off", !possible);
    label.title = possible ? "Drops move with the mouse and the app, or stay painted on the leaf" : "Only the Take theme with its full skin has drops";
    splashOn = localStorage.getItem("technozen-disruption") === "splash"; rippleOn = localStorage.getItem("technozen-ripple") !== "off";
    panel.querySelector(`[name=tz-mode][value=${splashOn ? "splash" : "gentle"}]`).checked = true;
    panel.querySelector(`[name=tz-ripple][value=${rippleOn ? "on" : "off"}]`).checked = true;
    panel.querySelector(".tz-dis").disabled = !possible || !wanted;
    panel.querySelector(".tz-sub").toggleAttribute("data-off", !splashOn);
    panel.querySelectorAll("[name=tz-ripple]").forEach(b => { b.disabled = !splashOn; });
    zenOn = localStorage.getItem("technozen-zenclick") === "on"; bellLevel = Number(localStorage.getItem("technozen-bell") || 50) / 100;
    panel.querySelector(".tz-zen").checked = zenOn;
    const kept = k => localStorage.getItem("technozen-" + k), when = kept("mind") || "off", custom = Math.max(1, Math.min(1440, Math.round(Number(kept("mind-custom")) || 15))); // whole minutes
    const every = when === "custom" ? custom : Number(when) || 0;
    if (every !== mind.every) mind.next = Date.now() + every * 60000;
    mind.every = every; mind.zen = kept("mind-zen") || "off"; mind.at = kept("mind-at") || "09:00"; mind.gap = kept("mind-gap") || "random"; mind.done = kept("mind-done") || "";
    panel.querySelector(`[name=tz-mind][value="${when}"]`).checked = true;
    panel.querySelector(`[name=tz-mind-zen][value="${mind.zen}"]`).checked = true;
    const minutes = panel.querySelector(".tz-mind-custom"), at = panel.querySelector(".tz-mind-at"), gap = panel.querySelector(".tz-gap");
    minutes.value = custom; minutes.disabled = when !== "custom"; at.value = mind.at; at.disabled = mind.zen !== "daily"; gap.value = mind.gap; gap.disabled = mind.zen === "off";
    const timed = every > 0 || mind.zen === "daily";
    clearInterval(window.technozenMindTimer);
    window.technozenMindTimer = timed ? setInterval(mindTick, 10000) : 0;
    panel.querySelector(".tz-bell").value = bellLevel * 100; panel.querySelector(".tz-bell").disabled = !zenOn && !timed;
    if (possible && wanted) startDrops(); else stopDrops();
  }

  if (window.technozenKeys) removeEventListener("keydown", window.technozenKeys); // re-running must not stack listeners
  addEventListener("keydown", window.technozenKeys = e => {
    if (!e.ctrlKey || !e.altKey || e.shiftKey) return;
    if (e.code === "KeyT") { e.preventDefault(); apply(ORDER[(ORDER.indexOf(html.dataset.technozen) + 1) % ORDER.length]); }
    if (e.code === "KeyS") { e.preventDefault(); skin(html.dataset.technozenSkin !== "on"); }
    if (e.code === "Digit0") { e.preventDefault(); remove(); }
  });

  stopDrops(); // running the snippet again must not double anything
  window.technozen = { apply, remove, skin };
  skin(localStorage.getItem("technozen-skin") !== "off");
  apply(localStorage.getItem("technozen") || ORDER[0]);
})();
