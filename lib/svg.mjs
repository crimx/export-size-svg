import prettyBytes from "pretty-bytes";

/**
 * @param {string | undefined} title
 * @param {import("./main").SVGOptions | undefined} options
 * @param {{ title: string, size: number }[]} sizes
 * @returns {string}
 * @see {@link https://github.com/anuraghazra/github-readme-stats}
 */
export function generateSVG(title, options, sizes) {
  const { cardWidth = 300, baselineSize = sizes.reduce((acc, { size }) => Math.max(acc, size), 0) } = options || {};
  const { titleColor = "#bd93f9f5", backgroundColor = "#282a36", textColor = "#f8f8f2" } = options?.theme || {};
  const verticalPadding = 30;
  const titleHeight = title ? 20 : 0;
  const cardHeight = sizes.length * 40 + verticalPadding * 2 + titleHeight;

  return `<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="descId">
  <title id="titleId"></title>
  <desc id="descId"></desc>
  <style>
    .header {
      font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: ${titleColor};
      animation: fadeInAnimation 0.8s ease-in-out forwards;
    }
    @supports(-moz-appearance: auto) {
      /* Selector detects Firefox */
      .header { font-size: 15.5px; }
    }

    @keyframes slideInAnimation {
      from {
        width: 0;
      }

      to {
        width: calc(100%-100px);
      }
    }

    @keyframes growWidthAnimation {
      from {
        width: 0;
      }

      to {
        width: 100%;
      }
    }

    .bold {
      font-weight: 700
    }

    .text {
      font: 400 11px "Segoe UI", Ubuntu, Sans-Serif;
      fill: ${textColor};
    }

    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }

    #rect-mask rect {
      animation: slideInAnimation 1s ease-in-out forwards;
    }

    .progress {
      animation: growWidthAnimation 0.6s ease-in-out forwards;
    }

    /* Animations */
    @keyframes scaleInAnimation {
      from {
        transform: translate(-5px, 5px) scale(0);
      }

      to {
        transform: translate(-5px, 5px) scale(1);
      }
    }

    @keyframes fadeInAnimation {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }
  </style>

  <rect x="0.5" y="0.5" rx="4.5" height="${cardHeight - 2}" stroke="#e4e2e2" width="${cardWidth - 2}" fill="${backgroundColor}" stroke-opacity="1" />

  ${
    title
      ? `<g transform="translate(25, ${verticalPadding})">
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">${title}</text>
    </g>
  </g>`
      : ""
  }

  <g transform="translate(0, ${verticalPadding + titleHeight})">
    <svg x="25">
      ${sizes.map((item, i) => sizeItem(options, cardWidth, baselineSize, i, item.title, item.size)).join("\n")}
    </svg>
  </g>
</svg>
`;
}

/**
 * @param {import("./main").SVGOptions | undefined} options
 * @param {number} cardWidth
 * @param {number} baselineSize
 * @param {number} i
 * @param {string} title
 * @param {number} size
 * @returns {string}
 */
function sizeItem(options, cardWidth, baselineSize, i, title, size) {
  const { progressColor = "#bd93f9", progressTrackColor = "#bd93f934" } = options?.theme || {};
  const progressWidth = cardWidth - 100;
  const staggerDelay = 100 + i * 150;
  const progressDelay = staggerDelay + 300;
  return `<g transform="translate(0, ${i * 40})">
  <g class="stagger" style="animation-delay: ${staggerDelay}ms">
    <text x="2" y="15" class="text">${title}</text>
    <text x="${progressWidth + 15}" y="34" class="text">${prettyBytes(size)}</text>

    <svg width="${progressWidth}" x="0" y="25">
      <rect rx="5" ry="5" x="0" y="0" width="${progressWidth}" height="8" fill="${progressTrackColor}"></rect>
      <svg width="${(size / (baselineSize || 1000)) * 100}%">
        <rect height="8" fill="${progressColor}" rx="5" ry="5" x="0" y="0" class="progress" style="animation-delay: ${progressDelay}ms" />
      </svg>
    </svg>
  </g>
</g>
`;
}
