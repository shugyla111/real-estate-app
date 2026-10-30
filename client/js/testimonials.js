// Demo data: names and reviews are fictional, photos are stock images.
const people = [
  { name: 'Clara Vidal',    role: 'Rented a first flat in Barcelona', img: 'images/people/p1.jpg', text: 'I had a list of must-haves and a tight budget. Three viewings later I signed for a sunny flat in Gràcia.' },
  { name: 'Pablo Ortega',   role: 'Student, rented in Valencia',      img: 'images/people/p2.jpg', text: 'Everything was sorted online before I even arrived. The contract was explained line by line.' },
  { name: 'Karim Benali',   role: 'Sold an apartment in Madrid',      img: 'images/people/p3.jpg', text: 'The price they suggested was realistic, and the apartment was under offer within a month.' },
  { name: 'Isabel Moreno',  role: 'Investor, three properties',       img: 'images/people/p4.jpg', text: 'Clear numbers on yield and costs for every option. No pressure, just solid data to decide on.' },
  { name: 'Lucía Navarro',  role: 'Renovated and sold',               img: 'images/people/p5.jpg', text: 'A new kitchen, fresh paint and good photos made all the difference. We sold above the first estimate.' },
  { name: 'Amara Diallo',   role: 'Relocated to Málaga',              img: 'images/people/p6.jpg', text: 'Video tours, quick answers and help with the paperwork made moving from abroad much easier.' },
  { name: 'Nadia Torres',   role: 'Bought a studio in Seville',       img: 'images/people/p7.jpg', text: 'Small budget, big wish list. They found a studio that ticked almost every box.' },
  { name: 'Andrés Romero',  role: 'Bought a penthouse in Madrid',     img: 'images/people/p8.jpg', text: 'Discreet, well prepared and always on time. From the first viewing to the keys took six weeks.' }
];

const facesEl = document.getElementById('faces');
const quoteEl = document.getElementById('quote');
const textEl = document.getElementById('quote-text');
let active = Math.floor(people.length / 2);
let timer;

people.forEach((p, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'face';
  btn.setAttribute('aria-label', p.name);
  btn.innerHTML = `
    <img src="${p.img}" alt="">
    <span class="face__meta"><strong>${p.name}</strong><small>${p.role}</small></span>`;
  btn.addEventListener('click', () => { show(i); restart(); });
  facesEl.appendChild(btn);
});

function show(i) {
  active = (i + people.length) % people.length;
  [...facesEl.children].forEach((el, idx) => {
    el.classList.toggle('is-active', idx === active);
    el.dataset.d = Math.min(Math.abs(idx - active), 3);
    el.setAttribute('aria-pressed', idx === active);
  });
  quoteEl.classList.add('is-changing');
  setTimeout(() => {
    textEl.textContent = `“${people[active].text}”`;
    quoteEl.classList.remove('is-changing');
  }, 200);
}

function restart() {
  clearInterval(timer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  timer = setInterval(() => show(active + 1), 6000);
}

document.getElementById('prev').addEventListener('click', () => { show(active - 1); restart(); });
document.getElementById('next').addEventListener('click', () => { show(active + 1); restart(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { show(active - 1); restart(); }
  if (e.key === 'ArrowRight') { show(active + 1); restart(); }
});
facesEl.addEventListener('mouseenter', () => clearInterval(timer));
facesEl.addEventListener('mouseleave', restart);

show(active);
restart();
