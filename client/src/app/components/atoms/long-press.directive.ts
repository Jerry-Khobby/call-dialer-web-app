import { Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';

/**
 * Tells a tap from a long press (hold 0 for "+", hold backspace to clear).
 * Use `(appTap)` instead of `(click)` on the same element: the click that ends a
 * long press is swallowed so it doesn't also count as a tap.
 */
@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective implements OnDestroy {
  @Input() longPressDelay = 500;
  @Output() appLongPress = new EventEmitter<void>();
  @Output() appTap = new EventEmitter<void>();

  #timer?: ReturnType<typeof setTimeout>;
  #fired = false;

  // Keyboard activation never long-presses, so make sure its click counts as a tap.
  @HostListener('keydown')
  reset() {
    this.#fired = false;
  }

  @HostListener('pointerdown')
  start() {
    this.reset();
    this.cancel();
    this.#timer = setTimeout(() => {
      this.#fired = true;
      this.appLongPress.emit();
    }, this.longPressDelay);
  }

  @HostListener('pointerup')
  @HostListener('pointerleave')
  @HostListener('pointercancel')
  cancel() {
    clearTimeout(this.#timer);
  }

  @HostListener('click')
  onClick() {
    if (this.#fired) {
      this.#fired = false;
      return;
    }
    this.appTap.emit();
  }

  // Holding a finger down on mobile would otherwise open the context menu.
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: Event) {
    event.preventDefault();
  }

  ngOnDestroy() {
    clearTimeout(this.#timer);
  }
}
