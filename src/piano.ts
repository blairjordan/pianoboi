const diatonicScale = [2, 2, 1, 2, 2, 2, 1]

const centerPiano = ({
  selector,
  totalWidth,
  currentPosition,
}: {
  selector: string
  totalWidth: number
  currentPosition: number
}): void => {
  $(selector).scrollLeft(
    (currentPosition * $(selector)[0].scrollWidth) / totalWidth -
      $(selector).width() / 2
  )
}

const keyMarkup = ({
  keyNumber,
  modifier = "",
}: {
  keyNumber: number
  modifier?: string
}): string => `<div class="key ${modifier}" data-keyno="${keyNumber}"></div>`

const buildKeyboard = ({
  selector,
  octaveCount,
  modifier,
  initialKey,
}: {
  selector: string
  octaveCount: number
  modifier: string
  initialKey: number
}): void => {
  for (let i = 0; i < octaveCount; i++) {
    diatonicScale.forEach((diatonicStep, j) => {
      $(selector).append(
        diatonicStep === 2
          ? `${keyMarkup({ keyNumber: initialKey++ })}${keyMarkup({
              keyNumber: initialKey++,
              modifier,
            })}`
          : keyMarkup({ keyNumber: initialKey++ })
      )
    })
  }
}

export { centerPiano, buildKeyboard }
