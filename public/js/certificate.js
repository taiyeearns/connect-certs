/**
 * GritinAI Connect 2.0 - Certificate Generator Engine
 * Uses the official 2560x1810 template (assets/certificate.jpg)
 */

const CertEngine = (function() {
  let templateImg = null;
  let templateLoaded = false;

  function loadTemplate() {
    return new Promise((resolve) => {
      if (templateLoaded && templateImg) return resolve(templateImg);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        templateImg = img;
        templateLoaded = true;
        resolve(img);
      };
      img.onerror = () => {
        console.error('Could not load certificate.jpg');
        resolve(null);
      };
      img.src = 'assets/certificate.jpg';
    });
  }

  let signatureImg = null;
  let signatureLoaded = false;

  function loadSignature() {
    return new Promise((resolve) => {
      if (signatureLoaded && signatureImg) return resolve(signatureImg);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        signatureImg = img;
        signatureLoaded = true;
        resolve(img);
      };
      img.onerror = () => {
        console.error('Could not load pm_signature.png');
        resolve(null);
      };
      img.src = 'assets/pm_signature.png';
    });
  }

  let ribbonImg = null;
  let ribbonLoaded = false;

  function loadRibbon() {
    return new Promise((resolve) => {
      if (ribbonLoaded && ribbonImg) return resolve(ribbonImg);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ribbonImg = img;
        ribbonLoaded = true;
        resolve(img);
      };
      img.onerror = () => {
        console.error('Could not load cert_ribbon.png');
        resolve(null);
      };
      img.src = 'assets/cert_ribbon.png';
    });
  }

  function drawCertificateRibbon(ctx, ribbon) {
    if (!ribbon) return;
    // 1. Cover the previous blue wheel with clean pure white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(1150, 1370, 275, 240);

    // 2. Draw realistic gold & blue ribbon centered between date and signature
    const w = 260;
    const h = Math.round(w * (ribbon.naturalHeight || ribbon.height) / (ribbon.naturalWidth || ribbon.width));
    const pasteX = Math.round(1280 - w / 2);
    // Align circular seal center at Y=1475 (offset is ~0.316 of total height)
    const pasteY = Math.round(1475 - 0.316 * h);
    ctx.drawImage(ribbon, pasteX, pasteY, w, h);
  }

  // 1. VOLUNTEER CERTIFICATE: 100% UNTOUCHED OFFICIAL TEMPLATE + NAME
  async function renderVolunteerCertificate(canvas, data) {
    const [img, ribbon] = await Promise.all([loadTemplate(), loadRibbon()]);
    const width = img ? (img.naturalWidth || img.width) : 2560;
    const height = img ? (img.naturalHeight || img.height) : 1810;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Draw the untouched original certificate image
    if (img) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Replace blue wheel with realistic gold & blue ribbon
    drawCertificateRibbon(ctx, ribbon);

    // 2. Render Volunteer Name directly onto the signature line
    const name = (data.fullName || 'VOLUNTEER NAME').trim();
    const centerX = width / 2;
    const nameY = 984; // Directly above line (Y = 998)

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    let fontSize = 76;
    if (name.length > 28) fontSize = 52;
    else if (name.length > 20) fontSize = 64;

    ctx.font = '700 ' + fontSize + 'px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#0a192f'; // Crisp deep navy
    ctx.fillText(name, centerX, nameY);

    ctx.restore();
  }

  // 2. ATTENDEE CERTIFICATE: Flawless seamless participation edition
  async function renderAttendeeCertificate(canvas, data) {
    const [img, sigImg, ribbon] = await Promise.all([loadTemplate(), loadSignature(), loadRibbon()]);
    const width = img ? (img.naturalWidth || img.width) : 2560;
    const height = img ? (img.naturalHeight || img.height) : 1810;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (img) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // A. Cover "OF SERVICE" completely with clean pure white (Y: 575 to 680)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width / 2 - 550, 575, 1100, 105);

    // Draw "OF PARTICIPATION" in exact matching blue
    ctx.font = '700 74px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#0052FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OF PARTICIPATION', width / 2, 630);

    // B. Cover citation text with clean pure white (Y: 1035 to 1150)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width / 2 - 850, 1010, 1700, 160);

    // Draw participation citation text
    ctx.font = '400 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('for your valuable participation and contribution to making', width / 2, 1065);
    ctx.fillText('GritinAi Connect 2.0 an amazing success!!', width / 2, 1115);

    // C. Right Signatory Section: Project Manager Fumike Adeyemi
    // 1. Cover old volunteer lead signature, name, and subtitle with pure white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(1500, 1300, 540, 300);

    // 2. Redraw horizontal line at Y=1520 (matching left date line)
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.moveTo(1515, 1520);
    ctx.lineTo(2026, 1520);
    ctx.stroke();

    // 3. Draw Fumike Adeyemi's signature above name
    if (sigImg) {
      // Signature bounding box inside 1254x1254: sx: 85, sy: 376, sw: 1079, sh: 552
      const sigTargetW = 260;
      const sigTargetH = Math.round(sigTargetW * 552 / 1079); // ~133px
      const sigTargetX = 1770 - Math.round(sigTargetW / 2);
      const sigTargetY = 1320;
      ctx.drawImage(sigImg, 85, 376, 1079, 552, sigTargetX, sigTargetY, sigTargetW, sigTargetH);
    }

    // 4. Draw Signatory Name "Fumike Adeyemi" above line
    ctx.font = '600 38px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Fumike Adeyemi', 1770, 1500);

    // 5. Draw Subtitle "Project Manager" below line
    ctx.font = '400 30px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Project Manager', 1770, 1555);

    // 6. Replace blue wheel with realistic gold & blue ribbon
    drawCertificateRibbon(ctx, ribbon);

    // D. Render Attendee Name directly onto the line
    const name = (data.fullName || 'CONFERENCE ATTENDEE').trim();
    const centerX = width / 2;
    const nameY = 984;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    let fontSize = 76;
    if (name.length > 28) fontSize = 52;
    else if (name.length > 20) fontSize = 64;

    ctx.font = '700 ' + fontSize + 'px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#0a192f';
    ctx.fillText(name, centerX, nameY);

    ctx.restore();
  }

  function downloadPNG(canvas, filename = 'GritinAI_Certificate.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadPDF(canvas, filename = 'GritinAI_Certificate.pdf') {
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      doc.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      doc.save(filename);
    } else {
      downloadPNG(canvas, filename.replace('.pdf', '.png'));
    }
  }

  return {
    renderAttendeeCertificate,
    renderVolunteerCertificate,
    downloadPNG,
    downloadPDF
  };
})();

window.CertEngine = CertEngine;
