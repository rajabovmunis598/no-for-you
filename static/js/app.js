const state = { books: [], index: 0, genre: '' };
const stage = document.querySelector('#book-stage');
const counter = document.querySelector('#counter');
const toast = document.querySelector('#toast');

async function loadBooks() {
  const params = new URLSearchParams();
  const search = document.querySelector('#search').value.trim();
  if (search) params.set('search', search);
  if (state.genre) params.set('genre', state.genre);
  const response = await fetch(`/api/books/?${params}`);
  const data = await response.json();
  state.books = data.results || data;
  state.index = 0;
  render();
}

function render(direction = 1) {
  if (!state.books.length) { stage.innerHTML = '<p class="empty">Китоб ёфт нашуд</p>'; counter.textContent = '00 / 00'; return; }
  const n = state.books.length;
  const item = (offset, cls) => { const book = state.books[(state.index + offset + n) % n]; return `<article class="book-card ${cls}"><img src="${book.cover_url || '/static/img/placeholder.svg'}" alt="${book.title}"><div class="card-info"><strong>${book.title}</strong><small>${book.author}</small></div></article>`; };
  const cards = item(-4, 'outer-left') + item(-3, 'far') + item(-2, 'side-left') + item(-1, 'near-left') + item(0, 'center') + item(1, 'near-right') + item(2, 'side-right') + item(3, 'far') + item(4, 'outer-right');
  const previous = stage.innerHTML;
  stage.classList.remove('slide-left', 'slide-right', 'turn-next', 'turn-prev');
  if (previous && previous.includes('book-card')) {
    stage.innerHTML = `<div class="carousel-layer old-layer">${previous}</div><div class="carousel-layer new-layer">${cards}</div>`;
    void stage.offsetWidth;
    stage.classList.add(direction > 0 ? 'turn-next' : 'turn-prev');
    setTimeout(() => {
      stage.innerHTML = cards;
      stage.classList.remove('turn-next', 'turn-prev');
    }, 500);
  } else {
    stage.innerHTML = cards;
  }
  counter.textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
}
function move(step) { if (state.books.length) { state.index = (state.index + step + state.books.length) % state.books.length; render(step); } }
document.querySelector('#next').onclick = () => move(1);
document.querySelector('#prev').onclick = () => move(-1);

// Natural mouse/touch swipe for the book deck.
let dragStartX = 0;
let dragDistance = 0;
let dragging = false;
stage.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragStartX = event.clientX;
  dragDistance = 0;
  stage.classList.add('dragging');
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  dragDistance = event.clientX - dragStartX;
  stage.style.transform = `translateX(${dragDistance}px)`;
});
stage.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove('dragging');
  stage.style.transform = '';
  if (Math.abs(dragDistance) > 65) move(dragDistance < 0 ? 1 : -1);
  stage.releasePointerCapture(event.pointerId);
});
stage.addEventListener('pointercancel', () => {
  dragging = false;
  stage.classList.remove('dragging');
  stage.style.transform = '';
});
document.querySelector('#search').oninput = (() => { let timer; return () => { clearTimeout(timer); timer = setTimeout(loadBooks, 350); }; })();
document.querySelectorAll('.side-link').forEach(button => button.onclick = () => { document.querySelectorAll('.side-link').forEach(x => x.classList.remove('active')); button.classList.add('active'); state.genre = button.dataset.genre; loadBooks(); });
document.querySelector('#addBook').onclick = () => { toast.textContent = 'Барои илова кардан аз /admin истифода баред'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); };
loadBooks();
