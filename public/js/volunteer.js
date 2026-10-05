// Volunteer Feedback & Certificate of Service Logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('volunteerFeedbackForm');
  const submitBtn = document.getElementById('submitBtn');
  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const teamSelect = document.getElementById('volunteerTeam');
  const volunteerComments = document.getElementById('volunteerComments');
  const improvementsInput = document.getElementById('improvements');

  const ratingSlider = document.getElementById('volunteerRatingSlider');
  const sliderValueText = document.getElementById('sliderValueText');
  const scaleSteps = document.querySelectorAll('#sliderScale .scale-step');

  const certCanvas = document.getElementById('certCanvas');
  const lockedOverlay = document.getElementById('lockedOverlay');

  const downloadVolunteerPng = document.getElementById('downloadVolunteerPng');
  const downloadVolunteerPdf = document.getElementById('downloadVolunteerPdf');
  const toastMsg = document.getElementById('toastMsg');

  const sliderLabels = {
    '1': '1 / 5 — Poor',
    '2': '2 / 5 — Fair',
    '3': '3 / 5 — Good',
    '4': '4 / 5 — Great',
    '5': '5 / 5 — Outstanding'
  };

  let currentVolRating = 5;
  let isUnlocked = false;

  let certData = {
    fullName: 'VOLUNTEER NAME HERE',
    volunteerTeam: 'Ushering & Protocol',
    certificateId: 'GAC2-VOL-PREVIEW',
    date: '26/09/2026'
  };

  function updatePreview() {
    CertEngine.renderVolunteerCertificate(certCanvas, {
      fullName: certData.fullName,
      volunteerTeam: certData.volunteerTeam,
      certificateId: certData.certificateId,
      date: certData.date
    });
  }

  // Initial preview on the official certificate template
  updatePreview();

  // Name input listener
  nameInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    certData.fullName = val || 'VOLUNTEER NAME HERE';
    updatePreview();
  });

  // Team selection listener
  teamSelect.addEventListener('change', (e) => {
    certData.volunteerTeam = e.target.value;
    updatePreview();
  });

  // Slider and Scale Dots sync
  function updateScaleVisuals(val) {
    currentVolRating = val;
    ratingSlider.value = val;
    sliderValueText.textContent = sliderLabels[val] || (val + ' / 5');
    scaleSteps.forEach(step => {
      const stepVal = parseInt(step.getAttribute('data-step'), 10);
      step.classList.toggle('active', stepVal <= val);
    });
  }

  ratingSlider.addEventListener('input', (e) => {
    updateScaleVisuals(parseInt(e.target.value, 10));
  });

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
    const team = teamSelect.value;
    const comments = volunteerComments.value.trim();
    const improvements = improvementsInput.value.trim();

    if (!fullName || !email) {
      alert('Please provide your full name and email.');
      return;
    }

    if (!comments) {
      alert('Please fill in: Volunteer Team Feedback');
      volunteerComments.focus();
      return;
    }

    if (!improvements) {
      alert('Please fill in: Suggestions for Next Time');
      improvementsInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting & Generating Certificate...';

    const payload = {
      role: 'volunteer',
      fullName: fullName,
      email: email,
      volunteerTeam: team,
      volunteerExperience: currentVolRating,
      ratingOverall: currentVolRating,
      volunteerComments: comments,
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
      certData = {
        fullName: fullName,
        volunteerTeam: team,
        certificateId: data.entry.certificateId,
        date: '26/09/2026'
      };

      updatePreview();

      lockedOverlay.classList.add('hidden');
      downloadVolunteerPng.disabled = false;
      downloadVolunteerPdf.disabled = false;

      submitBtn.classList.remove('btn-primary');
      submitBtn.classList.add('btn-emerald');
      submitBtn.innerHTML = 'Volunteer Feedback Submitted Successfully!';

      showToast('🌟 Certificate of Service Unlocked! Thank you for volunteering.');

      document.querySelector('.certificate-preview-box').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Feedback & Unlock Certificate';
    }
  });

  // Download Volunteer PNG
  downloadVolunteerPng.addEventListener('click', async () => {
    if (!isUnlocked) return;
    await CertEngine.renderVolunteerCertificate(certCanvas, certData);
    const cleanName = certData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    CertEngine.downloadPNG(certCanvas, 'GritinAI_Certificate_of_Service_' + cleanName + '.png');
    showToast('📥 Certificate PNG downloaded!');
  });

  // Download Volunteer PDF
  downloadVolunteerPdf.addEventListener('click', async () => {
    if (!isUnlocked) return;
    await CertEngine.renderVolunteerCertificate(certCanvas, certData);
    const cleanName = certData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    CertEngine.downloadPDF(certCanvas, 'GritinAI_Certificate_of_Service_' + cleanName + '.pdf');
    showToast('📄 Certificate PDF downloaded!');
  });
});
