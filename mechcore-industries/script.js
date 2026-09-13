(function(){
  "use strict";

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  if(navToggle && mainNav){
    navToggle.addEventListener('click', function(){
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        mainNav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Facility spec tabs ---------- */
  var tabButtons = document.querySelectorAll('.spec-tab-btn');
  var panels = document.querySelectorAll('.spec-panel');
  tabButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = btn.getAttribute('data-tab');

      tabButtons.forEach(function(b){
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      panels.forEach(function(p){
        var match = p.getAttribute('data-panel') === target;
        p.classList.toggle('is-active', match);
        if(match){ p.removeAttribute('hidden'); } else { p.setAttribute('hidden',''); }
      });
    });
  });

  /* ---------- Gallery lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var lightboxClose = document.getElementById('lightboxClose');
  var galleryItems = document.querySelectorAll('.g-item');
  var lastFocused = null;

  function openLightbox(src, caption){
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox(){
    lightbox.setAttribute('hidden', '');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if(lastFocused){ lastFocused.focus(); }
  }

  galleryItems.forEach(function(item){
    item.addEventListener('click', function(){
      openLightbox(item.getAttribute('data-full'), item.getAttribute('data-caption'));
    });
  });

  if(lightboxClose){ lightboxClose.addEventListener('click', closeLightbox); }
  if(lightbox){
    lightbox.addEventListener('click', function(e){
      if(e.target === lightbox){ closeLightbox(); }
    });
  }
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !lightbox.hasAttribute('hidden')){ closeLightbox(); }
  });

  /* ---------- Quote form: posts to /api/contact, falls back to mailto ---------- */
  var quoteForm = document.getElementById('quoteForm');
  var formNote = document.getElementById('formNote');
  var submitBtn = quoteForm ? quoteForm.querySelector('button[type="submit"]') : null;

  function setNote(text, isError){
    formNote.textContent = text;
    formNote.classList.toggle('is-error', !!isError);
  }

  function mailtoFallback(name, company, email, message){
    var subject = encodeURIComponent('Quote request from ' + name + (company ? ' (' + company + ')' : ''));
    var body = encodeURIComponent(
      message + '\n\n---\nName: ' + name + '\nCompany: ' + (company || '-') + '\nEmail: ' + email
    );
    window.location.href = 'mailto:mechcore.ind@gmail.com?subject=' + subject + '&body=' + body;
    setNote('Could not reach the server, so we opened your email app instead.', true);
  }

  if(quoteForm){
    quoteForm.addEventListener('submit', function(e){
      e.preventDefault();

      var name = document.getElementById('fname').value.trim();
      var email = document.getElementById('femail').value.trim();
      var message = document.getElementById('fmsg').value.trim();
      var company = document.getElementById('fcompany').value.trim();
      var website = document.getElementById('fwebsite').value.trim(); // honeypot

      if(!name || !email || !message){
        setNote('Please fill in your name, email and a short message.', true);
        return;
      }

      if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      setNote('Sending your request…');

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, company: company, message: message, website: website })
      })
        .then(function(res){
          if(!res.ok){ throw new Error('Request failed with status ' + res.status); }
          return res.json();
        })
        .then(function(){
          setNote('Thanks — we\u2019ve got your request and will get back to you shortly.');
          quoteForm.reset();
        })
        .catch(function(){
          mailtoFallback(name, company, email, message);
        })
        .finally(function(){
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Send request'; }
        });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

})();
