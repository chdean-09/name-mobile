export function slideInOut() {
  document.documentElement.animate(
    [
      {
        opacity: 1,
        transform: 'translate(0, 0)',
      },
      {
        opacity: 0,
        transform: 'translate(-100px, 0)',
      },
    ],
    {
      duration: 400,
      easing: 'ease',
      fill: 'forwards',
      pseudoElement: '::view-transition-old(root)',
    }
  )

  document.documentElement.animate(
    [
      {
        opacity: 0,
        transform: 'translate(100px, 0)',
      },
      {
        opacity: 1,
        transform: 'translate(0, 0)',
      },
    ],
    {
      duration: 400,
      easing: 'ease',
      fill: 'forwards',
      pseudoElement: '::view-transition-new(root)',
    }
  )
}

export function slideInOutBack() {
  document.documentElement.animate(
    [
      {
        opacity: 1,
        transform: 'translate(0, 0)',
      },
      {
        opacity: 0,
        transform: 'translate(100px, 0)', // slide right
      },
    ],
    {
      duration: 400,
      easing: 'ease',
      fill: 'forwards',
      pseudoElement: '::view-transition-old(root)',
    }
  );

  document.documentElement.animate(
    [
      {
        opacity: 0,
        transform: 'translate(-100px, 0)', // come in from left
      },
      {
        opacity: 1,
        transform: 'translate(0, 0)',
      },
    ],
    {
      duration: 400,
      easing: 'ease',
      fill: 'forwards',
      pseudoElement: '::view-transition-new(root)',
    }
  );
}