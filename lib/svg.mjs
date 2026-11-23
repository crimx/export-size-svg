import prettyBytes from "pretty-bytes";

/**
 * @typedef {{ title: string, size: number }} SizeItem
 * @typedef {{ title: string, exports: SizeItem[] }} SizeGroup
 */

/**
 * @param {(SizeItem | SizeGroup)[]} sizes
 * @returns {number}
 */
function getMaxSize(sizes) {
  let max = 0;
  for (const entry of sizes) {
    if ("exports" in entry) {
      for (const item of entry.exports) {
        if (item.size > max) max = item.size;
      }
    } else if (entry.size > max) {
      max = entry.size;
    }
  }
  return max;
}

/**
 * @param {string | undefined} title
 * @param {import("./main").SVGOptions | undefined} options
 * @param {(SizeItem | SizeGroup)[]} sizes
 * @returns {string}
 * @see {@link https://github.com/anuraghazra/github-readme-stats}
 */
export function generateSVG(title, options, sizes) {
  const { cardWidth = 300, baselineSize = getMaxSize(sizes) } = options || {};
  const {
    titleColor = "#bd93f9f5",
    groupTitleColor = titleColor,
    backgroundColor = "#282a36",
    textColor = "#f8f8f2",
    progressColor = "#bd93f9",
    progressTrackColor = "#bd93f934",
  } = options?.theme || {};
  const verticalPadding = 30;
  const titleHeight = title ? 20 : 0;
  const hasGroups = sizes.some((entry) => "exports" in entry);
  const leftIndent = hasGroups ? 12 : 0;
  const contentX = 25 + leftIndent;
  const progressWidth = cardWidth - 100 - leftIndent;

  const itemHeight = 40;
  const groupHeaderHeight = 24;
  const groupGap = 14;

  let cursorY = 0;
  let staggerIndex = 0;
  let prevWasGroup = false;
  const fragments = [];

  for (const entry of sizes) {
    if ("exports" in entry) {
      if (cursorY > 0) cursorY += groupGap;
      const groupStartY = cursorY;
      const groupDelay = 100 + staggerIndex * 150;
      fragments.push(`<g transform="translate(0, ${groupStartY})">
  <g class="stagger" style="animation-delay: ${groupDelay}ms">
    <rect x="-12" y="5.5" width="3" height="12" rx="1.5" fill="${progressColor}" />
    <text x="0" y="16" class="group-header">${entry.title}</text>
  </g>
</g>`);
      staggerIndex += 1;
      cursorY += groupHeaderHeight;

      const itemsStartY = cursorY;
      for (const item of entry.exports) {
        fragments.push(sizeItem(options, progressWidth, baselineSize, cursorY, staggerIndex, item.title, item.size));
        cursorY += itemHeight;
        staggerIndex += 1;
      }

      if (entry.exports.length > 0) {
        const trunkX = -10.5;
        const radius = 5;
        const branchEndX = -3.5;
        const trunkStartY = groupStartY + 24;
        const lastBranchY = itemsStartY + (entry.exports.length - 1) * itemHeight + 29;
        const pathParts = [
          `M ${trunkX} ${trunkStartY} V ${lastBranchY - radius} Q ${trunkX} ${lastBranchY} ${trunkX + radius} ${lastBranchY} H ${branchEndX}`,
        ];
        for (let k = 0; k < entry.exports.length - 1; k++) {
          const branchY = itemsStartY + k * itemHeight + 29;
          pathParts.push(
            `M ${trunkX} ${branchY - radius} Q ${trunkX} ${branchY} ${trunkX + radius} ${branchY} H ${branchEndX}`,
          );
        }
        fragments.push(`<g class="stagger" style="animation-delay: ${groupDelay}ms">
  <path d="${pathParts.join(" ")}" fill="none" stroke="${progressTrackColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</g>`);
      }

      prevWasGroup = true;
    } else {
      if (prevWasGroup) cursorY += groupGap;
      fragments.push(sizeItem(options, progressWidth, baselineSize, cursorY, staggerIndex, entry.title, entry.size));
      cursorY += itemHeight;
      staggerIndex += 1;
      prevWasGroup = false;
    }
  }

  const cardHeight = cursorY + verticalPadding * 2 + titleHeight;

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

    .group-header {
      font: 600 13px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: ${groupTitleColor};
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

  <g transform="translate(${contentX}, ${verticalPadding + titleHeight})">
    ${fragments.join("\n")}
  </g>
</svg>
`;
}

/**
 * @param {import("./main").SVGOptions | undefined} options
 * @param {number} progressWidth
 * @param {number} baselineSize
 * @param {number} y
 * @param {number} staggerIndex
 * @param {string} title
 * @param {number} size
 * @returns {string}
 */
function sizeItem(options, progressWidth, baselineSize, y, staggerIndex, title, size) {
  const { progressColor = "#bd93f9", progressTrackColor = "#bd93f934" } = options?.theme || {};
  const staggerDelay = 100 + staggerIndex * 150;
  const progressDelay = staggerDelay + 300;
  return `<g transform="translate(0, ${y})">
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
