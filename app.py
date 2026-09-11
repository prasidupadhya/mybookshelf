#!/usr/bin/env python3
"""Serve the My Bookshelf single-page site using only the Python standard library."""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

UI_COPY = {'en': {'heading': 'My bookshelf',
        'intro': "Books I've finished, what I'm reading now, and what I want to read next.",
        'shelves': {'current': 'Currently reading', 'want': 'Want to read', 'read': 'Read'},
        'nextBook': 'Next book',
        'pages': 'pages',
        'coverUnavailable': 'Cover unavailable',
        'readOnGoodreads': 'Read about it on Goodreads',
        'closeDetails': 'Close book details',
        'languageLabel': 'Language',
        'footerPrefix': '',
        'footerSuffix': "'s bookshelf"},
 'es': {'heading': 'Mi biblioteca',
        'intro': 'Libros que ya he leído, lo que estoy leyendo ahora y lo que quiero leer después.',
        'shelves': {'current': 'Leyendo ahora', 'want': 'Quiero leer', 'read': 'Leídos'},
        'nextBook': 'Próximo libro',
        'pages': 'páginas',
        'coverUnavailable': 'Portada no disponible',
        'readOnGoodreads': 'Leer más en Goodreads',
        'closeDetails': 'Cerrar detalles del libro',
        'languageLabel': 'Idioma',
        'footerPrefix': 'Biblioteca de',
        'footerSuffix': ''}}

SHELVES = ({'id': 'current'}, {'id': 'want'}, {'id': 'read'})

BOOKS = ({'id': 'siddhartha',
  'title': {'en': 'Siddhartha', 'es': 'Siddhartha'},
  'author': 'Hermann Hesse',
  'url': 'https://www.goodreads.com/en/book/show/52036.Siddhartha',
  'shelf': 'read',
  'shelfOrder': 3,
  'pageCount': 152,
  'accentColor': '#3c3489',
  'coverUrl': 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1629378189i/52036.jpg',
  'description': {'en': 'Set in ancient India during the time of the Buddha, a young Brahmin named Siddhartha leaves '
                        'home to seek enlightenment. He tries asceticism, worldly pleasure, wealth, and love, then '
                        'finds peace as a ferryman by a river. A novel about learning through direct experience rather '
                        'than doctrine.',
                  'es': 'Ambientada en la India antigua en tiempos de Buda, un joven brahmán llamado Siddhartha deja '
                        'su hogar en busca de la iluminación. Prueba el ascetismo, el placer mundano, la riqueza y el '
                        'amor, y finalmente encuentra paz como barquero junto a un río. Una novela sobre el '
                        'aprendizaje a través de la experiencia directa en lugar de la doctrina.'}},
 {'id': 'the-stranger',
  'title': {'en': 'The Stranger', 'es': 'El Extranjero'},
  'author': 'Albert Camus',
  'url': 'https://www.goodreads.com/book/show/49552.The_Stranger',
  'shelf': 'read',
  'shelfOrder': 3,
  'pageCount': 123,
  'accentColor': '#c7c6c7',
  'coverUrl': 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1738704267i/49552.jpg',
  'description': {'en': "Meursault, an emotionally detached Algerian clerk, drifts through his mother's funeral and "
                        'later kills a man for almost no reason. His trial and imprisonment work through absurdism, '
                        'the idea that life has no inherent meaning and that a person can still face that fact '
                        'honestly.',
                  'es': 'Meursault, un empleado argelino emocionalmente distante, pasa por el funeral de su madre con '
                        'indiferencia y más tarde mata a un hombre casi sin razón. Su juicio y encarcelamiento '
                        'desarrollan el absurdismo, la idea de que la vida no tiene un sentido inherente y que aun así '
                        'una persona puede enfrentar esa verdad con honestidad.'}},
 {'id': 'white-nights',
  'title': {'en': 'White Nights', 'es': 'Noches Blancas'},
  'author': 'Fyodor Dostoevsky',
  'url': 'https://www.goodreads.com/book/show/1772910.White_Nights',
  'shelf': 'read',
  'shelfOrder': 3,
  'pageCount': 82,
  'accentColor': '#d4c0a4',
  'coverUrl': 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1450699039i/1772910.jpg',
  'description': {'en': 'A lonely dreamer in St. Petersburg spends four nights wandering the city. He falls for a '
                        'young woman, Nastenka, who is waiting for her former lover to return. A short book about '
                        'loneliness and the pain of a connection that never becomes real.',
                  'es': 'Un soñador solitario en San Petersburgo pasa cuatro noches vagando por la ciudad. Se enamora '
                        'de una joven, Nastenka, que espera el regreso de su antiguo amor. Un libro breve sobre la '
                        'soledad y el dolor de una conexión que nunca llega a concretarse.'}},
 {'id': 'the-metamorphosis',
  'title': {'en': 'The Metamorphosis', 'es': 'La Metamorfosis'},
  'author': 'Franz Kafka',
  'url': 'https://www.goodreads.com/book/show/485894.The_Metamorphosis',
  'shelf': 'current',
  'shelfOrder': 1,
  'pageCount': 201,
  'accentColor': '#aa7764',
  'coverUrl': 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1646444605i/485894.jpg',
  'description': {'en': 'Traveling salesman Gregor Samsa wakes up transformed into a giant insect. The novella follows '
                        "his family's disgust, guilt, and eventual indifference toward him. A short story about "
                        "isolation and how a person's worth gets tied to what they can produce.",
                  'es': 'El viajante de comercio Gregor Samsa despierta transformado en un insecto gigante. La novela '
                        'sigue el asco, la culpa y la eventual indiferencia de su familia hacia él. Un relato breve '
                        'sobre el aislamiento y cómo el valor de una persona termina ligado a lo que puede producir.'}},
 {'id': 'the-bhagavad-gita',
  'title': {'en': 'The Bhagavad Gita', 'es': 'El Bhagavad Gita'},
  'author': 'Unknown',
  'url': 'https://www.goodreads.com/book/show/99944.The_Bhagavad_Gita',
  'shelf': 'want',
  'shelfOrder': 2,
  'pageCount': 160,
  'accentColor': '#6c584f',
  'coverUrl': 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1769077152i/99944.jpg',
  'description': {'en': 'A foundational Hindu scripture written as a dialogue between the warrior prince Arjuna and '
                        "the god Krishna on the eve of a great battle. Arjuna doesn't want to fight his own kin, and "
                        "Krishna's response lays out teachings on duty, action without attachment to results, and the "
                        'nature of the self and the divine.',
                  'es': 'Una escritura fundamental del hinduismo, escrita como un diálogo entre el príncipe guerrero '
                        'Arjuna y el dios Krishna en vísperas de una gran batalla. Arjuna no quiere luchar contra sus '
                        'propios parientes, y la respuesta de Krishna expone enseñanzas sobre el deber, la acción sin '
                        'apego a los resultados, y la naturaleza del ser y lo divino.'}})

CSS = r"""  :root {
      --ink: #17251f;
      --ink-deep: #0f1b17;
      --walnut: #6b432b;
      --parchment: #eadfca;
      --brass: #b99a5b;
      --page-bg-start: #12211b;
      --page-bg-middle: #17251f;
      --page-bg-end: #0f1c18;
      --page-text: #f4ead8;
      --muted-text: #b8ad98;
      --control-muted: #817d70;
      --control-active: #eadfca;
      --bookcase-surface: #13231d;
      --bookcase-border: rgba(185, 154, 91, .16);
      --bookcase-shadow: rgba(0, 0, 0, .36);
      --shelf-label: #eadfca;
      --shelf-bay-top: rgba(0,0,0,.26);
      --shelf-bay-side: rgba(0,0,0,.2);
      --slot-border: rgba(234, 223, 202, .26);
      --slot-border-bottom: rgba(234, 223, 202, .13);
      --slot-text: rgba(234, 223, 202, .42);
      --slot-bg: rgba(8, 16, 13, .18);
      --footer-text: #968c7b;
      --focus-ring: #e6c77e;
      --grain-opacity: .22;
      --grain-blend: soft-light;
      --theme-control-bg: rgba(234, 223, 202, .035);
      --theme-control-border: rgba(234, 223, 202, .16);
      --theme-control-hover: rgba(234, 223, 202, .08);
    }

    html[data-theme="dark"] { color-scheme: dark; }

    html[data-theme="light"] {
      color-scheme: light;
      --page-bg-start: #f4ead8;
      --page-bg-middle: #e9dcc4;
      --page-bg-end: #ddc9aa;
      --page-text: #20372e;
      --muted-text: #625e51;
      --control-muted: #756f61;
      --control-active: #263b32;
      --bookcase-surface: #d8c5a5;
      --bookcase-border: rgba(99, 70, 42, .24);
      --bookcase-shadow: rgba(83, 57, 31, .22);
      --shelf-label: #2f453b;
      --shelf-bay-top: rgba(83, 58, 36, .13);
      --shelf-bay-side: rgba(83, 58, 36, .09);
      --slot-border: rgba(75, 57, 40, .34);
      --slot-border-bottom: rgba(75, 57, 40, .2);
      --slot-text: rgba(53, 48, 40, .62);
      --slot-bg: rgba(255, 250, 238, .22);
      --footer-text: #655c50;
      --focus-ring: #315344;
      --grain-opacity: .12;
      --grain-blend: multiply;
      --theme-control-bg: rgba(255, 250, 238, .38);
      --theme-control-border: rgba(75, 57, 40, .2);
      --theme-control-hover: rgba(255, 250, 238, .7);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
      background:
        radial-gradient(circle at 18% 8%, rgba(185, 154, 91, .08), transparent 28rem),
        radial-gradient(circle at 78% 18%, rgba(234, 223, 202, .035), transparent 34rem),
        linear-gradient(135deg, var(--page-bg-start) 0%, var(--page-bg-middle) 48%, var(--page-bg-end) 100%);
      color: var(--page-text);
      font-family: "DM Sans", sans-serif;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: var(--grain-opacity);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
      mix-blend-mode: var(--grain-blend);
    }

    button,
    a { font: inherit; }

    body.has-open-bookplate { overflow: hidden; }

    :focus-visible {
      outline: 3px solid var(--focus-ring);
      outline-offset: 4px;
    }

    .page-shell {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 56px 0 72px;
      position: relative;
    }

    .library-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 28px;
      margin-bottom: 34px;
    }

    .library-header__copy {
      min-width: 0;
    }

    .library-header h1 {
      margin: 0;
      font-family: "Newsreader", serif;
      font-size: clamp(2.7rem, 6vw, 5.8rem);
      font-weight: 500;
      line-height: .88;
      letter-spacing: -.045em;
    }

    .library-header p {
      max-width: none;
      margin: 18px 0 0;
      color: var(--muted-text);
      font-size: .94rem;
      line-height: 1.45;
      white-space: nowrap;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 0 0 auto;
    }

    .language-switcher {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-top: 5px;
      color: var(--control-muted);
      font-size: .78rem;
    }

    .language-switcher__button {
      min-width: 30px;
      min-height: 30px;
      padding: 2px 4px;
      border: 0;
      border-bottom: 1px solid transparent;
      color: inherit;
      background: transparent;
      cursor: pointer;
      font-size: .76rem;
      font-weight: 600;
      letter-spacing: .04em;
    }

    .language-switcher__button:hover,
    .language-switcher__button.is-active {
      color: var(--control-active);
      border-bottom-color: var(--brass);
    }

    .theme-toggle {
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px;
      border: 1px solid var(--theme-control-border);
      border-radius: 999px;
      color: var(--control-active);
      background: var(--theme-control-bg);
      cursor: pointer;
      font-size: .76rem;
      font-weight: 600;
      transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
    }

    .theme-toggle:hover { background: var(--theme-control-hover); }

    .theme-toggle__mark {
      width: 13px;
      height: 13px;
      flex: 0 0 13px;
      border: 1.5px solid currentColor;
      border-radius: 50%;
    }

    .theme-toggle[data-next-theme="light"] .theme-toggle__mark {
      background: var(--brass);
      border-color: var(--brass);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--brass) 20%, transparent);
    }

    .theme-toggle[data-next-theme="dark"] .theme-toggle__mark {
      background: transparent;
      box-shadow: inset -4px -1px 0 0 currentColor;
    }

    .bookcase {
      position: relative;
      padding: 34px 40px 14px;
      border: 1px solid var(--bookcase-border);
      border-radius: 2px;
      background:
        linear-gradient(90deg, rgba(255,255,255,.018), transparent 15%, transparent 85%, rgba(0,0,0,.09)),
        var(--bookcase-surface);
      box-shadow:
        0 32px 70px var(--bookcase-shadow),
        inset 0 0 0 10px rgba(21, 13, 9, .08);
    }

    .bookcase::before,
    .bookcase::after {
      content: "";
      position: absolute;
      top: -14px;
      bottom: -14px;
      width: 22px;
      z-index: 0;
      background:
        linear-gradient(90deg, rgba(255,255,255,.08), transparent 22%, rgba(0,0,0,.19)),
        repeating-linear-gradient(4deg, var(--walnut) 0 5px, #754a30 6px 9px, #654028 10px 15px);
      box-shadow: 0 8px 18px rgba(0,0,0,.28);
    }

    .bookcase::before { left: -11px; }
    .bookcase::after { right: -11px; transform: scaleX(-1); }

    .shelf {
      position: relative;
      z-index: 1;
      margin-bottom: 35px;
    }

    .shelf__label {
      margin: 0 0 10px;
      font-size: .92rem;
      font-weight: 500;
      color: var(--shelf-label);
    }

    .shelf__books {
      min-height: 214px;
      display: flex;
      align-items: end;
      gap: 12px;
      padding: 12px 18px 15px;
      position: relative;
      border-left: 1px solid rgba(255,255,255,.03);
      border-right: 1px solid rgba(0,0,0,.22);
      background:
        linear-gradient(180deg, var(--shelf-bay-top), transparent 48%),
        linear-gradient(90deg, var(--shelf-bay-side), transparent 10%, transparent 90%, var(--shelf-bay-side));
      box-shadow: inset 0 18px 28px rgba(0,0,0,.16);
    }

    .shelf__books::after {
      content: "";
      position: absolute;
      left: -8px;
      right: -8px;
      bottom: -16px;
      height: 22px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.08), transparent 32%, rgba(0,0,0,.2)),
        repeating-linear-gradient(2deg, #795036 0 5px, var(--walnut) 6px 10px, #5b3825 11px 16px);
      border-top: 1px solid rgba(234, 223, 202, .11);
      border-bottom: 4px solid #352017;
      box-shadow: 0 9px 13px rgba(0,0,0,.3);
      z-index: 4;
    }

    .book {
      --book-width: 66px;
      --book-height: 186px;
      width: var(--book-width);
      height: var(--book-height);
      flex: 0 0 var(--book-width);
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 12px 13px;
      border: 0;
      border-radius: 3px 4px 2px 3px;
      color: var(--book-ink, #f7eedc);
      background: var(--book-accent);
      box-shadow:
        inset 4px 0 rgba(255,255,255,.08),
        inset -4px 0 rgba(0,0,0,.16),
        4px 7px 9px rgba(0,0,0,.22);
      cursor: pointer;
      overflow: hidden;
      text-align: left;
      isolation: isolate;
      transform: translateY(0);
      transition:
        transform 260ms cubic-bezier(.16, 1, .3, 1),
        box-shadow 260ms cubic-bezier(.16, 1, .3, 1);
    }

    .book:hover,
    .book:focus-visible {
      transform: translateY(-11px);
      box-shadow:
        inset 4px 0 rgba(255,255,255,.1),
        inset -4px 0 rgba(0,0,0,.15),
        7px 15px 18px rgba(0,0,0,.34),
        0 0 24px color-mix(in srgb, var(--book-accent) 28%, transparent);
    }

    .book::before,
    .book::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: -1;
    }

    .book::after {
      inset: 6px 5px;
      border-left: 1px solid rgba(255,255,255,.13);
      border-right: 1px solid rgba(0,0,0,.13);
    }

    .book__title {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-family: "Newsreader", serif;
      font-size: clamp(.82rem, 1.15vw, 1rem);
      font-weight: 600;
      line-height: 1;
      letter-spacing: .015em;
      text-shadow: 0 1px 1px rgba(0,0,0,.12);
      overflow-wrap: anywhere;
    }

    .book__author {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: clamp(.46rem, .72vw, .58rem);
      line-height: 1;
      letter-spacing: .04em;
      color: currentColor;
      overflow-wrap: anywhere;
    }

    .book[data-book="siddhartha"] {
      --book-height: 191px;
      background:
        radial-gradient(circle at 50% 18%, rgba(255,255,255,.16) 0 10px, transparent 11px),
        repeating-linear-gradient(90deg, transparent 0 13px, rgba(0,0,0,.12) 14px 15px),
        var(--book-accent);
    }

    .book[data-book="siddhartha"]::before {
      background: linear-gradient(180deg, rgba(255,255,255,.12), transparent 34%, rgba(0,0,0,.16));
    }

    .book[data-book="the-stranger"] {
      --book-height: 177px;
      background:
        repeating-linear-gradient(164deg, rgba(20,18,19,.18) 0 4px, transparent 4px 14px),
        var(--book-accent);
    }

    .book[data-book="the-stranger"]::before {
      background: linear-gradient(180deg, rgba(255,255,255,.18), transparent 38%, rgba(0,0,0,.06));
    }

    .book[data-book="white-nights"] {
      --book-height: 170px;
      background:
        repeating-linear-gradient(2deg, rgba(65,52,41,.06) 0 1px, transparent 1px 7px),
        var(--book-accent);
    }

    .book[data-book="white-nights"]::before {
      background: linear-gradient(155deg, transparent 0 66%, rgba(51,42,35,.12) 67% 69%, transparent 70%);
    }

    .book[data-book="the-metamorphosis"] {
      --book-height: 198px;
      background:
        radial-gradient(ellipse at 50% 41%, rgba(18,24,17,.62) 0 13px, transparent 14px),
        linear-gradient(90deg, transparent 42%, rgba(19,26,18,.38) 43% 46%, transparent 47% 54%, rgba(19,26,18,.38) 55% 58%, transparent 59%),
        var(--book-accent);
    }

    .book[data-book="the-metamorphosis"]::before {
      background: repeating-radial-gradient(ellipse at center, transparent 0 12px, rgba(15,20,14,.12) 13px 14px);
    }

    .book[data-book="the-bhagavad-gita"] {
      --book-height: 194px;
      background:
        linear-gradient(90deg, transparent 0 8px, rgba(255,255,255,.1) 9px 10px, transparent 11px calc(100% - 11px), rgba(255,255,255,.1) calc(100% - 10px) calc(100% - 9px), transparent calc(100% - 8px)),
        repeating-linear-gradient(180deg, transparent 0 20px, rgba(255,255,255,.07) 21px 22px),
        var(--book-accent);
    }

    .book-slot {
      width: 64px;
      height: 174px;
      flex: 0 0 64px;
      display: grid;
      place-items: center;
      align-self: end;
      margin-left: 6px;
      position: relative;
      z-index: 2;
      border: 1px dashed var(--slot-border);
      border-bottom-color: var(--slot-border-bottom);
      color: var(--slot-text);
      background: var(--slot-bg);
      box-shadow: inset 0 0 24px rgba(0,0,0,.12);
    }

    .book-slot span {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-family: "Newsreader", serif;
      font-size: .76rem;
      letter-spacing: .03em;
    }

    .library-footer {
      display: flex;
      align-items: baseline;
      justify-content: flex-end;
      gap: 7px;
      padding: 36px 8px 0;
      color: var(--footer-text);
    }

    .library-footer__identity {
      display: inline-flex;
      align-items: baseline;
      white-space: nowrap;
    }

    .library-footer__prefix,
    .library-footer__suffix {
      font-size: .82rem;
    }

    .library-footer__prefix {
      margin-right: 5px;
    }

    .library-footer__signature {
      display: inline-block;
      font-family: "Caveat", cursive;
      font-size: 1.55rem;
      line-height: 1;
      transform: rotate(-1.5deg);
      transform-origin: right center;
    }

    .library-footer__suffix {
      margin-left: 2px;
    }

    .library-footer__clock::before {
      content: "·";
      margin-right: 7px;
    }

    .library-footer__clock {
      font-size: .78rem;
      line-height: 1.3;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .bookplate {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      padding: 24px;
      opacity: 0;
      transition: opacity 280ms cubic-bezier(.22, 1, .36, 1);
    }

    .bookplate[hidden] { display: none; }

    .bookplate.is-open { opacity: 1; }

    .bookplate__scrim {
      position: absolute;
      inset: 0;
      background: rgba(8, 14, 11, .76);
      backdrop-filter: blur(8px);
    }

    .bookplate__card {
      --plate-accent: var(--brass);
      width: min(760px, 100%);
      min-height: 430px;
      max-height: calc(100dvh - 48px);
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(190px, .78fr) minmax(0, 1.42fr);
      gap: 34px;
      padding: 42px;
      overflow-y: auto;
      color: #2b2118;
      background:
        repeating-linear-gradient(0deg, rgba(83,61,39,.035) 0 1px, transparent 1px 5px),
        var(--parchment);
      border: 1px solid #aa936b;
      border-radius: 2px;
      box-shadow: 0 30px 80px rgba(0,0,0,.5);
      transform: translateY(20px) scale(.965);
      transition: transform 420ms cubic-bezier(.16, 1, .3, 1);
    }

    .bookplate.is-open .bookplate__card {
      transform: translateY(0) scale(1);
    }

    .bookplate__card::before {
      content: "";
      position: absolute;
      inset: 10px;
      pointer-events: none;
      border: 1px solid color-mix(in srgb, var(--plate-accent) 58%, #5e4c35);
    }

    .bookplate__cover-column,
    .bookplate__details {
      position: relative;
      z-index: 1;
    }

    .bookplate__cover-column {
      display: grid;
      place-items: center;
      padding: 20px 0 10px 10px;
    }

    .bookplate__cover-frame {
      width: min(100%, 218px);
      aspect-ratio: 2 / 3;
      margin: 0;
      display: grid;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--plate-accent) 42%, #5d4b36);
      background: #d8ccb5;
      box-shadow: 10px 14px 24px rgba(67, 47, 29, .24);
    }

    .bookplate__cover,
    .bookplate__cover-fallback {
      grid-area: 1 / 1;
      width: 100%;
      height: 100%;
    }

    .bookplate__cover {
      display: block;
      object-fit: cover;
      background: #cfc1aa;
    }

    .bookplate__cover[hidden],
    .bookplate__cover-fallback[hidden] {
      display: none;
    }

    .bookplate__cover-fallback {
      place-items: center;
      align-content: center;
      gap: 12px;
      padding: 24px 18px;
      color: #5d4f40;
      background:
        linear-gradient(135deg, rgba(255,255,255,.15), transparent 35%),
        #cfc1aa;
      text-align: center;
    }

    .bookplate__cover-fallback:not([hidden]) { display: grid; }

    .bookplate__cover-fallback span {
      font-family: "Newsreader", serif;
      font-size: 1.45rem;
      line-height: 1.05;
    }

    .bookplate__cover-fallback small {
      font-size: .72rem;
      color: #786957;
    }

    .bookplate__details {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 28px 28px 24px 0;
      text-align: left;
    }

    .bookplate__ornament {
      width: 72px;
      height: 1px;
      margin-bottom: 28px;
      position: relative;
      background: var(--plate-accent);
    }

    .bookplate__ornament::after {
      content: "◆";
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      padding: 0 8px;
      color: var(--plate-accent);
      background: var(--parchment);
      font-size: .55rem;
    }

    .bookplate__title {
      width: 100%;
      max-width: 420px;
      margin: 0;
      font-family: "Newsreader", serif;
      font-size: clamp(2rem, 5vw, 4.4rem);
      font-weight: 500;
      line-height: .96;
      letter-spacing: -.035em;
      overflow-wrap: anywhere;
      text-wrap: balance;
    }

    .bookplate__author {
      margin: 14px 0 0;
      color: #5e5144;
      font-size: .94rem;
      line-height: 1.4;
    }

    .bookplate__pages {
      margin: 5px 0 0;
      color: #7a6955;
      font-size: .8rem;
    }

    .bookplate__description {
      width: 100%;
      max-width: 430px;
      margin: 28px 0 30px;
      font-family: "Newsreader", serif;
      font-size: clamp(1rem, 1.6vw, 1.12rem);
      line-height: 1.52;
      color: #44382d;
      overflow-wrap: anywhere;
    }

    .bookplate__link {
      display: inline-block;
      padding-bottom: 3px;
      color: #2f493d;
      font-size: .88rem;
      font-weight: 600;
      text-decoration: none;
      border-bottom: 1px solid #738b7e;
    }

    .bookplate__link:hover {
      color: #1f392e;
      border-bottom-color: #315344;
    }

    .bookplate__link:focus-visible,
    .bookplate__close:focus-visible {
      outline-color: #315344;
    }

    .bookplate__close {
      position: absolute;
      top: 22px;
      right: 22px;
      z-index: 3;
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      background: transparent;
      color: #514538;
      cursor: pointer;
    }

    .bookplate__close:hover { color: #1f392e; }

    .bookplate__close svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
      stroke-width: 1.6;
      fill: none;
      transition: transform 320ms cubic-bezier(.34, 1.56, .64, 1);
    }

    .bookplate__close:hover svg,
    .bookplate__close:focus-visible svg {
      transform: rotate(90deg);
    }

    @media (max-width: 760px) {
      .page-shell {
        width: min(100% - 20px, 680px);
        padding: 32px 0 40px;
      }

      .library-header {
        display: block;
        margin: 0 10px 30px;
      }

      .library-header h1 {
        font-size: clamp(3.2rem, 16vw, 5rem);
      }

      .library-header p {
        width: 100%;
        max-width: 42rem;
        margin-top: 18px;
        font-size: clamp(.86rem, 3.6vw, .94rem);
        line-height: 1.48;
        white-space: normal;
        text-wrap: balance;
      }

      .language-switcher {
        margin-top: 16px;
      }

      .header-controls {
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .header-controls .language-switcher { margin-top: 0; }

      .language-switcher__button {
        min-width: 44px;
        min-height: 44px;
      }

      .theme-toggle {
        min-height: 44px;
        padding-inline: 12px;
      }

      .bookcase {
        padding: 26px 15px 8px;
      }

      .bookcase::before,
      .bookcase::after {
        width: 14px;
      }

      .bookcase::before { left: -7px; }
      .bookcase::after { right: -7px; }

      .shelf {
        margin-bottom: 31px;
      }

      .shelf__label {
        padding-left: 7px;
      }

      .shelf__books {
        min-height: 212px;
        gap: 10px;
        padding: 12px 10px 24px;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-inline: contain;
        scrollbar-width: thin;
        scrollbar-color: rgba(185,154,91,.4) transparent;
        scroll-snap-type: x proximity;
      }

      .book {
        scroll-snap-align: start;
      }

      .shelf__books::after {
        bottom: 0;
      }

      .bookplate {
        padding: 12px;
      }

      .bookplate__card {
        grid-template-columns: 126px minmax(0, 1fr);
        gap: 22px;
        min-height: 0;
        max-height: calc(100dvh - 24px);
        padding: 34px 28px;
        overflow-y: auto;
      }

      .bookplate__cover-column {
        align-self: start;
        padding: 34px 0 0;
      }

      .bookplate__details {
        padding: 32px 20px 18px 0;
      }

      .bookplate__title {
        font-size: clamp(1.9rem, 8.5vw, 3.5rem);
      }

      .bookplate__description {
        margin-block: 22px 24px;
      }

      .library-footer {
        padding-inline: 12px;
      }

    }

    @media (max-width: 520px) {
      .bookplate {
        padding: 8px;
      }

      .bookplate__card {
        width: 100%;
        grid-template-columns: 1fr;
        gap: 10px;
        max-height: calc(100dvh - 16px);
        padding: 46px 22px 26px;
      }

      .bookplate__cover-column {
        padding: 10px 0 0;
      }

      .bookplate__cover-frame {
        width: min(116px, 36vw);
      }

      .bookplate__details {
        align-items: center;
        padding: 8px 2px 10px;
        text-align: center;
      }

      .bookplate__title {
        font-size: clamp(2rem, 11.5vw, 3.15rem);
      }

      .bookplate__description {
        margin: 18px auto 22px;
        font-size: .98rem;
        line-height: 1.48;
      }

      .bookplate__ornament { margin-bottom: 18px; }

      .bookplate__close {
        top: 10px;
        right: 10px;
      }

      .library-footer {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding-top: 30px;
        text-align: center;
      }

      .library-footer__clock {
        white-space: nowrap;
        text-align: center;
      }

      .library-footer__clock::before {
        display: none;
      }
    }

    @media (max-width: 390px) {
      .page-shell {
        width: calc(100% - 12px);
        padding-top: 26px;
      }

      .library-header {
        margin-inline: 8px;
      }

      .library-header h1 {
        font-size: clamp(3rem, 17vw, 4.25rem);
      }

      .library-header p {
        font-size: .86rem;
        letter-spacing: -.01em;
      }

      .bookcase {
        padding-inline: 10px;
      }

      .shelf__books {
        padding-inline: 8px;
      }

      .bookplate__card {
        padding-inline: 16px;
      }
    }

    @media (max-width: 430px) {
      .bookcase { padding-inline: 10px; }
      .shelf__books { padding-inline: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .theme-toggle,
      .book,
      .bookplate,
      .bookplate__card,
      .bookplate__close svg {
        transition: none;
      }

      .book:hover,
      .book:focus-visible,
      .bookplate__card,
      .bookplate.is-open .bookplate__card,
      .bookplate__close:hover svg,
      .bookplate__close:focus-visible svg {
        transform: none;
      }
    }
"""

THEME_JS = r"""const THEME_STORAGE_KEY = "bookshelf-theme";
const THEME_COLORS = Object.freeze({ dark: "#0f1b17", light: "#e9dcc4" });
const THEME_COPY = Object.freeze({
  en: Object.freeze({ light: "Light", dark: "Dark", toLight: "Switch to light theme", toDark: "Switch to dark theme" }),
  es: Object.freeze({ light: "Claro", dark: "Oscuro", toLight: "Cambiar al tema claro", toDark: "Cambiar al tema oscuro" })
});

const systemTheme = window.matchMedia("(prefers-color-scheme: light)");

function readStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
}

function getPreferredTheme() {
  return readStoredTheme() ?? (systemTheme.matches ? "light" : "dark");
}

function getThemeLanguage() {
  return document.documentElement.lang === "es" ? "es" : "en";
}

function updateThemeToggle() {
  const toggle = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  if (!toggle || !label) return;

  const currentTheme = document.documentElement.dataset.theme || getPreferredTheme();
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  const copy = THEME_COPY[getThemeLanguage()];

  toggle.dataset.nextTheme = nextTheme;
  toggle.setAttribute("aria-label", nextTheme === "light" ? copy.toLight : copy.toDark);
  toggle.title = nextTheme === "light" ? copy.toLight : copy.toDark;
  label.textContent = copy[nextTheme];
}

function setTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still works when local storage is unavailable.
    }
  }

  updateThemeToggle();
}

setTheme(getPreferredTheme());

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("[data-theme-toggle]");
  updateThemeToggle();

  toggle?.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });
});

systemTheme.addEventListener("change", (event) => {
  if (!readStoredTheme()) setTheme(event.matches ? "light" : "dark");
});

window.addEventListener("bookshelf:languagechange", updateThemeToggle);
"""

SHELF_JS = r"""const MIN_SPINE_WIDTH = 52;
const MAX_SPINE_WIDTH = 112;
const SPINE_BASE_WIDTH = 46;
const SPINE_WIDTH_PER_PAGE = 0.18;

const bookcase = document.querySelector("[data-bookcase]");
const bookplate = document.querySelector("#bookplate");
const bookplateCard = bookplate.querySelector(".bookplate__card");
const bookplateTitle = bookplate.querySelector("[data-bookplate-title]");
const bookplateAuthor = bookplate.querySelector("[data-bookplate-author]");
const bookplatePages = bookplate.querySelector("[data-bookplate-pages]");
const bookplateDescription = bookplate.querySelector("[data-bookplate-description]");
const bookplateLink = bookplate.querySelector("[data-bookplate-link]");
const bookplateCover = bookplate.querySelector("[data-bookplate-cover]");
const bookplateCoverFallback = bookplate.querySelector("[data-bookplate-cover-fallback]");
const bookplateCoverTitle = bookplate.querySelector("[data-bookplate-cover-title]");
const bookplateCoverFallbackLabel = bookplate.querySelector("[data-bookplate-cover-fallback-label]");
const bookplateClose = bookplate.querySelector(".bookplate__close");
const pageShell = document.querySelector("[data-page-shell]");
const heading = document.querySelector("[data-heading]");
const intro = document.querySelector("[data-intro]");
const languageGroup = document.querySelector("[data-language-group]");
const languageButtons = [...document.querySelectorAll("[data-language]")];
const footerPrefix = document.querySelector("[data-footer-prefix]");
const footerSuffix = document.querySelector("[data-footer-suffix]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let lastFocusedSpine = null;
let activeLanguage = "en";
let activeBookIndex = null;

function getSpineWidth(pageCount) {
  const scaledWidth = SPINE_BASE_WIDTH + pageCount * SPINE_WIDTH_PER_PAGE;
  return Math.round(Math.min(MAX_SPINE_WIDTH, Math.max(MIN_SPINE_WIDTH, scaledWidth)));
}

function getRelativeLuminance(hexColor) {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hexColor.slice(index, index + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function getContrastRatio(colorA, colorB) {
  const lighter = Math.max(getRelativeLuminance(colorA), getRelativeLuminance(colorB));
  const darker = Math.min(getRelativeLuminance(colorA), getRelativeLuminance(colorB));
  return (lighter + 0.05) / (darker + 0.05);
}

function getReadableInk(backgroundColor) {
  const darkInk = "#17110f";
  const lightInk = "#fff8e8";

  return getContrastRatio(backgroundColor, darkInk) >= getContrastRatio(backgroundColor, lightInk)
    ? darkInk
    : lightInk;
}

function createShelf({ id }) {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const booksContainer = document.createElement("div");
  const headingId = `${id}-label`;

  section.className = "shelf";
  section.dataset.shelf = id;
  section.setAttribute("aria-labelledby", headingId);

  heading.className = "shelf__label";
  heading.id = headingId;
  heading.textContent = UI_COPY[activeLanguage].shelves[id];

  booksContainer.className = "shelf__books";
  booksContainer.dataset.shelfBooks = "";
  section.append(heading, booksContainer);

  return { section, booksContainer };
}

function createBookSpine(book, index) {
  const button = document.createElement("button");
  const title = document.createElement("span");
  const author = document.createElement("span");
  const spineWidth = getSpineWidth(book.pageCount);

  button.className = "book";
  button.type = "button";
  button.dataset.bookIndex = index;
  const localizedTitle = book.title[activeLanguage];
  button.dataset.book = book.id;
  button.dataset.pageCount = book.pageCount;
  button.style.setProperty("--book-accent", book.accentColor);
  button.style.setProperty("--book-ink", getReadableInk(book.accentColor));
  button.style.setProperty("--book-width", `${spineWidth}px`);
  button.setAttribute(
    "aria-label",
    `${localizedTitle} — ${book.author}, ${book.pageCount} ${UI_COPY[activeLanguage].pages}`
  );

  title.className = "book__title";
  title.textContent = localizedTitle;
  author.className = "book__author";
  author.textContent = book.author;

  button.append(title, author);
  return button;
}

function renderLibrary() {
  bookcase.replaceChildren();
  const shelfElements = new Map();
  const orderedShelves = SHELVES
    .map((shelf) => ({
      ...shelf,
      order: Math.min(
        ...BOOKS.filter((book) => book.shelf === shelf.id).map((book) => book.shelfOrder)
      )
    }))
    .sort((a, b) => a.order - b.order);

  orderedShelves.forEach((shelf) => {
    const { section, booksContainer } = createShelf(shelf);
    shelfElements.set(shelf.id, booksContainer);
    bookcase.append(section);
  });

  BOOKS.forEach((book, index) => {
    shelfElements.get(book.shelf)?.append(createBookSpine(book, index));
  });

  const futureSlot = document.createElement("div");
  const futureSlotLabel = document.createElement("span");
  futureSlot.className = "book-slot";
  futureSlot.setAttribute("aria-hidden", "true");
  futureSlotLabel.textContent = UI_COPY[activeLanguage].nextBook;
  futureSlot.append(futureSlotLabel);
  shelfElements.get("want")?.append(futureSlot);
}

function showCover(book) {
  bookplateCoverFallback.hidden = true;
  bookplateCover.hidden = false;
  const localizedTitle = book.title[activeLanguage];
  bookplateCover.alt = activeLanguage === "es"
    ? `Portada de ${localizedTitle}`
    : `Cover of ${localizedTitle}`;
  bookplateCoverTitle.textContent = localizedTitle;

  bookplateCover.onerror = () => {
    bookplateCover.hidden = true;
    bookplateCoverFallback.hidden = false;
    bookplateCover.removeAttribute("src");
  };

  bookplateCover.src = book.coverUrl;
}

function populateBookplate(book) {
  bookplateTitle.textContent = book.title[activeLanguage];
  bookplateAuthor.textContent = book.author;
  bookplatePages.textContent = `${book.pageCount} ${UI_COPY[activeLanguage].pages}`;
  bookplateDescription.textContent = book.description[activeLanguage];
  bookplateLink.textContent = UI_COPY[activeLanguage].readOnGoodreads;
  bookplateLink.href = book.url;
  bookplateClose.setAttribute("aria-label", UI_COPY[activeLanguage].closeDetails);
  bookplateCoverFallbackLabel.textContent = UI_COPY[activeLanguage].coverUnavailable;
  bookplateCard.style.setProperty("--plate-accent", book.accentColor);
  showCover(book);
}

function openBookplate(book, spine, index) {
  lastFocusedSpine = spine;
  activeBookIndex = index;
  populateBookplate(book);

  bookplate.hidden = false;
  pageShell.inert = true;
  document.body.classList.add("has-open-bookplate");
  requestAnimationFrame(() => bookplate.classList.add("is-open"));
  bookplateClose.focus({ preventScroll: true });
}

function finishClose() {
  if (!bookplate.classList.contains("is-open")) {
    bookplate.hidden = true;
  }
  pageShell.inert = false;
  document.body.classList.remove("has-open-bookplate");
  activeBookIndex = null;
  lastFocusedSpine?.focus({ preventScroll: true });
}

function setLanguage(language) {
  if (!UI_COPY[language]) return;

  activeLanguage = language;
  document.documentElement.lang = language;
  heading.textContent = UI_COPY[language].heading;
  intro.textContent = UI_COPY[language].intro;
  languageGroup.setAttribute("aria-label", UI_COPY[language].languageLabel);
  footerPrefix.textContent = UI_COPY[language].footerPrefix;
  footerPrefix.hidden = !UI_COPY[language].footerPrefix;
  footerSuffix.textContent = UI_COPY[language].footerSuffix;
  footerSuffix.hidden = !UI_COPY[language].footerSuffix;

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderLibrary();

  if (activeBookIndex !== null && !bookplate.hidden) {
    lastFocusedSpine = bookcase.querySelector(`[data-book-index="${activeBookIndex}"]`);
    populateBookplate(BOOKS[activeBookIndex]);
  }

  window.dispatchEvent(new CustomEvent("bookshelf:languagechange", {
    detail: { language }
  }));
}

function closeBookplate() {
  bookplate.classList.remove("is-open");

  if (reduceMotion.matches) {
    finishClose();
    return;
  }

  window.setTimeout(finishClose, 440);
}

function trapBookplateFocus(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeBookplate();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...bookplate.querySelectorAll("button, a[href]")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

bookcase.addEventListener("click", (event) => {
  const spine = event.target.closest("[data-book-index]");
  if (!spine) return;
  const index = Number(spine.dataset.bookIndex);
  openBookplate(BOOKS[index], spine, index);
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

bookplate.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-bookplate]")) closeBookplate();
});

bookplate.addEventListener("keydown", trapBookplateFocus);

renderLibrary();
"""

CLOCK_JS = r"""const footerClock = document.querySelector("[data-live-clock]");
const CLOCK_LOCALES = Object.freeze({ en: "en-GB", es: "es-ES" });
let clockLanguage = document.documentElement.lang === "es" ? "es" : "en";

function createClockFormatter(language) {
  return new Intl.DateTimeFormat(CLOCK_LOCALES[language], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

let footerClockFormatter = createClockFormatter(clockLanguage);

function updateFooterClock() {
  const now = new Date();
  footerClock.dateTime = now.toISOString();
  footerClock.textContent = footerClockFormatter.format(now);
}

updateFooterClock();
window.setInterval(updateFooterClock, 1000);

window.addEventListener("bookshelf:languagechange", (event) => {
  clockLanguage = event.detail.language;
  footerClockFormatter = createClockFormatter(clockLanguage);
  updateFooterClock();
});
"""



def _json_for_script(value: object) -> str:
    """Serialize trusted Python data safely for an inline script element."""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def render_page() -> str:
    client_data = (
        f"const UI_COPY = {_json_for_script(UI_COPY)};\n"
        f"const SHELVES = {_json_for_script(SHELVES)};\n"
        f"const BOOKS = {_json_for_script(BOOKS)};"
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="A personal bookshelf of literary and philosophical classics.">
  <meta name="theme-color" content="#0f1b17">
  <title>My Bookshelf</title>
  <script>{THEME_JS}</script>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%230f1b17'/%3E%3Cpath d='M13 17c7-2 13 0 19 5v27c-6-5-12-7-19-5V17Zm38 0c-7-2-13 0-19 5v27c6-5 12-7 19-5V17Z' fill='%23eadfca'/%3E%3Cpath d='M32 22v27' stroke='%23b99a5b' stroke-width='2'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&amp;family=DM+Sans:wght@400;500;600&amp;family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&amp;display=swap" rel="stylesheet">
  <style>{CSS}</style>
</head>
<body>
  <div class="page-shell" data-page-shell>
    <header class="library-header">
      <div class="library-header__copy">
        <h1 data-heading>My bookshelf</h1>
        <p data-intro>Books I've finished, what I'm reading now, and what I want to read next.</p>
      </div>
      <div class="header-controls">
        <div class="language-switcher" role="group" aria-label="Language" data-language-group>
          <button class="language-switcher__button is-active" type="button" data-language="en" aria-pressed="true">EN</button>
          <span aria-hidden="true">/</span>
          <button class="language-switcher__button" type="button" data-language="es" aria-pressed="false">ES</button>
        </div>
        <button class="theme-toggle" type="button" data-theme-toggle>
          <span class="theme-toggle__mark" aria-hidden="true"></span>
          <span data-theme-label>Light</span>
        </button>
      </div>
    </header>

    <main class="bookcase" data-bookcase aria-label="Personal book collection"></main>

    <footer class="library-footer">
      <span class="library-footer__identity">
        <span class="library-footer__prefix" data-footer-prefix hidden></span>
        <span class="library-footer__signature">Prasid</span>
        <span class="library-footer__suffix" data-footer-suffix>'s bookshelf</span>
      </span>
      <time class="library-footer__clock" data-live-clock></time>
    </footer>
  </div>

  <section class="bookplate" id="bookplate" role="dialog" aria-modal="true" aria-labelledby="bookplate-title" hidden>
    <div class="bookplate__scrim" data-close-bookplate></div>
    <article class="bookplate__card">
      <button class="bookplate__close" type="button" aria-label="Close book details" data-close-bookplate>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18"></path>
        </svg>
      </button>

      <div class="bookplate__cover-column">
        <figure class="bookplate__cover-frame">
          <img class="bookplate__cover" data-bookplate-cover alt="" loading="eager">
          <figcaption class="bookplate__cover-fallback" data-bookplate-cover-fallback hidden>
            <span data-bookplate-cover-title></span>
            <small data-bookplate-cover-fallback-label>Cover unavailable</small>
          </figcaption>
        </figure>
      </div>

      <div class="bookplate__details">
        <div class="bookplate__ornament" aria-hidden="true"></div>
        <h2 class="bookplate__title" id="bookplate-title" data-bookplate-title></h2>
        <p class="bookplate__author" data-bookplate-author></p>
        <p class="bookplate__pages" data-bookplate-pages></p>
        <p class="bookplate__description" data-bookplate-description></p>
        <a class="bookplate__link" data-bookplate-link target="_blank" rel="noopener noreferrer">Read about it on Goodreads</a>
      </div>
    </article>
  </section>

  <script>{client_data}</script>
  <script>{SHELF_JS}</script>
  <script>{CLOCK_JS}</script>
</body>
</html>"""


class BookshelfHandler(BaseHTTPRequestHandler):
    """Minimal HTTP handler for the single-page application."""

    server_version = "BookshelfHTTP/1.0"

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        path = urlsplit(self.path).path
        if path in {"/", "/index.html"}:
            self._send(200, render_page().encode("utf-8"), "text/html; charset=utf-8")
            return
        if path == "/favicon.ico":
            self._send(204, b"", "image/x-icon")
            return
        self._send(404, b"Not found\n", "text/plain; charset=utf-8")

    def do_HEAD(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self.do_GET()

    def log_message(self, format: str, *args: object) -> None:
        """Keep routine request logs quiet."""
        return


def main() -> None:
    host = "127.0.0.1"
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), BookshelfHandler)
    print(f"My Bookshelf is running at http://localhost:{port}")
    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        print("\nStopping My Bookshelf.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
