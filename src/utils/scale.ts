import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const DESIGN_WIDTH = 393;
const FRAME_WIDTH = Math.min(width, DESIGN_WIDTH);
const SCALE = Math.min(width / DESIGN_WIDTH, 1);

export function s(value: number): number {
  return Math.round(value * SCALE);
}

export function getCardDimensions() {
  const contentWidth = Math.min(width - s(32), s(361));
  const cardWidth = contentWidth;
  const deckTopWidth = Math.round(cardWidth * (297 / 361));
  const deckMiddleWidth = Math.round(cardWidth * (321 / 361));
  const cardImageHeight = Math.round((cardWidth - s(32)) * (9 / 16));
  const cardHeight = s(245) + cardImageHeight;
  const deckHeight = cardHeight + s(22);
  const swipeExitDistance = width + cardWidth;
  const middleCardScaleValue = deckMiddleWidth / cardWidth;
  const backCardScaleValue = deckTopWidth / cardWidth;

  return {
    cardWidth,
    cardHeight,
    cardImageHeight,
    deckTopWidth,
    deckMiddleWidth,
    deckHeight,
    swipeExitDistance,
    middleCardScaleValue,
    backCardScaleValue,
    contentWidth,
  };
}

export function getTopHeight() {
  return Math.max(height - 97 * SCALE, 650 * SCALE);
}

export function getMainAreaPadding() {
  return Math.max(s(49), Math.round((height - 758) * 0.26));
}

export function scaleTopOffset(scaleValue: number, cardHeight: number): number {
  return Math.round(((1 - scaleValue) * cardHeight) / 2);
}

export function getNewsIndex(index: number, total: number): number {
  return total === 0 ? 0 : (index + total) % total;
}

export { width, height, FRAME_WIDTH, SCALE, DESIGN_WIDTH };
