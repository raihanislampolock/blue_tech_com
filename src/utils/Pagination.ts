export class Pagination {
    private container: HTMLElement;
    private onPageChange: (page: number) => void;
    private currentPage: number;
    private totalPages: number;

    constructor(container: HTMLElement, onPageChange: (page: number) => void) {
      this.container = container;
      this.onPageChange = onPageChange;
      this.currentPage = 1;
      this.totalPages = 1;
    }

    /**
     * Updates the pagination component with new data.
     * @param totalItems - Total number of items.
     * @param itemsPerPage - Number of items per page.
     * @param currentPage - Current page (optional, defaults to 1).
     */
    update(totalItems: number, itemsPerPage: number, currentPage: number = 1): void {
      this.currentPage = currentPage;
      this.totalPages = Math.ceil(totalItems / itemsPerPage);
      this.render();
    }

    /**
     * Renders the pagination buttons.
     */
    private render(): void {
      this.container.innerHTML = '';
      if (this.totalPages <= 1) return;

      const prevButton = this.createButton('«', this.currentPage > 1, () => this.changePage(this.currentPage - 1));
      const nextButton = this.createButton('»', this.currentPage < this.totalPages, () => this.changePage(this.currentPage + 1));

      this.container.appendChild(prevButton);
      for (let i = 1; i <= this.totalPages; i++) {
        const pageButton = this.createButton(
          i.toString(),
          i !== this.currentPage,
          () => this.changePage(i),
          i === this.currentPage
        );
        this.container.appendChild(pageButton);
      }
      this.container.appendChild(nextButton);
    }

    /**
     * Creates a pagination button.
     * @param label - The text label for the button.
     * @param isEnabled - Whether the button is enabled.
     * @param onClick - The click handler for the button.
     * @param isActive - Whether the button is the active page.
     * @returns The created button element.
     */
    private createButton(
      label: string,
      isEnabled: boolean,
      onClick: () => void,
      isActive: boolean = false
    ): HTMLLIElement {
      const li = document.createElement('li');
      li.classList.add('page-item');
      if (!isEnabled) li.classList.add('disabled');
      if (isActive) li.classList.add('active');

      const a = document.createElement('a');
      a.classList.add('page-link');
      a.textContent = label;
      a.href = '#';
      if (isEnabled) a.addEventListener('click', (e) => { e.preventDefault(); onClick(); });

      li.appendChild(a);
      return li;
    }

    /**
     * Changes the current page and triggers the onPageChange callback.
     * @param page - The new page to change to.
     */
    private changePage(page: number): void {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.onPageChange(page);
    }
  }
