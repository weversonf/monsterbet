function createParticles(){

  const particles =
    document.getElementById('particles');

  for(let i = 0; i < 45; i++){

    const particle =
      document.createElement('div');

    particle.classList.add('particle');

    particle.style.left =
      Math.random() * 100 + '%';

    particle.style.animationDuration =
      (6 + Math.random() * 8) + 's';

    particle.style.opacity =
      Math.random();

    particle.style.width =
    particle.style.height =
      (2 + Math.random() * 5) + 'px';

    particles.appendChild(particle);

  }

}

function showToast(msg, isError){

  let toast =
    document.querySelector('.toast');

  if(!toast){

    toast =
      document.createElement('div');

    toast.className = 'toast';

    document.body.appendChild(toast);

  }

  toast.textContent = msg;

  toast.classList.toggle('toast-error', !!isError);

  toast.classList.add('show');

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {

    toast.classList.remove('show');

  }, 2500);

}
