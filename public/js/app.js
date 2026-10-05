// Attendee Feedback & Certificate Logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const submitBtn = document.getElementById('submitBtn');
  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const favMomentInput = document.getElementById('favoriteMoment');
  const improveInput = document.getElementById('improvements');

  const ratingSlider = document.getElementById('overallRatingSlider');
  const sliderValueText = document.getElementById('sliderValueText');
  const scaleSteps = document.querySelectorAll('#sliderScale .scale-step');

  const certCanvas = document.getElementById('certCanvas');
  const lockedOverlay = document.getElementById('lockedOverlay');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const toastMsg = document.getElementById('toastMsg');

  const sliderLabels = {
    '1': '1 / 5 — Poor',
    '2': '2 / 5 — Fair',
    '3': '3 / 5 — Good',
    '4': '4 / 5 — Great',
    '5': '5 / 5 — Exceptional'
  };

  let currentRating = 5;
  let certificateData = {
    fullName: 'YOUR NAME HERE',
    certificateId: 'GAC2-ATT-PREVIEW',
    date: '26/09/2026'
  };
  let isUnlocked = false;

  // Initial preview render using official template
  CertEngine.renderAttendeeCertificate(certCanvas, certificateData);

  // Live name preview as attendee types
  nameInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    certificateData.fullName = val || 'YOUR NAME HERE';
    CertEngine.renderAttendeeCertificate(certCanvas, certificateData);
  });

  // Function to sync scale dots and text
  function updateScaleVisuals(val) {
    currentRating = val;
    ratingSlider.value = val;
    sliderValueText.textContent = sliderLabels[val] || (val + ' / 5');
    scaleSteps.forEach(step => {
      const stepVal = parseInt(step.getAttribute('data-step'), 10);
      step.classList.toggle('active', stepVal <= val);
    });
  }

  // Slider input event
  ratingSlider.addEventListener('input', (e) => {
    updateScaleVisuals(parseInt(e.target.value, 10));
  });

  // Click on scale steps directly
  scaleSteps.forEach(step => {
    step.addEventListener('click', () => {
      const stepVal = parseInt(step.getAttribute('data-step'), 10);
      updateScaleVisuals(stepVal);
    });
  });

  function showToast(msg) {
    toastMsg.textContent = msg;
    toastMsg.classList.add('show');
    setTimeout(() => toastMsg.classList.remove('show'), 4000);
  }

  // Handle Form Submission with required validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const favMoment = favMomentInput.value.trim();
    const improvements = improveInput.value.trim();

    if (!fullName || !email) {
      alert('Please enter your full name and email address.');
      return;
    }

    if (!favMoment) {
      alert('Please answer: What did you enjoy most?');
      favMomentInput.focus();
      return;
    }

    if (!improvements) {
      alert('Please answer: Suggestions for next time');
      improveInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting & Generating Certificate...';

    const payload = {
      role: 'attendee',
      fullName: fullName,
      email: email,
      ratingOverall: currentRating,
      favoriteMoment: favMoment,
      improvements: improvements,
      recommendScore: 10
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      isUnlocked = true;
      certificateData = {
        fullName: fullName,
        certificateId: data.entry.certificateId,
        date: '26/09/2026'
      };

      // Re-render final certificate with recipient name
      await CertEngine.renderAttendeeCertificate(certCanvas, certificateData);

      lockedOverlay.classList.add('hidden');
      downloadPngBtn.disabled = false;
      downloadPdfBtn.disabled = false;

      submitBtn.classList.remove('btn-primary');
      submitBtn.classList.add('btn-emerald');
      submitBtn.innerHTML = 'Feedback Submitted Successfully!';

      showToast('🎉 Feedback received! Your certificate is unlocked.');

      document.querySelector('.certificate-preview-box').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Feedback & Unlock Certificate';
    }
  });

  // Download PNG
  downloadPngBtn.addEventListener('click', () => {
    if (!isUnlocked) return;
    const cleanName = certificateData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    CertEngine.downloadPNG(certCanvas, 'GritinAI_Certificate_' + cleanName + '.png');
    showToast('📥 Certificate PNG downloaded!');
  });

  // Download PDF
  downloadPdfBtn.addEventListener('click', () => {
    if (!isUnlocked) return;
    const cleanName = certificateData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    CertEngine.downloadPDF(certCanvas, 'GritinAI_Certificate_' + cleanName + '.pdf');
    showToast('📄 Certificate PDF downloaded!');
  });
});
