const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'feedback.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'gritinai2026';

function initDataStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initialFile = path.join(__dirname, 'data', 'feedback.json');
      if (fs.existsSync(initialFile)) {
        try {
          fs.copyFileSync(initialFile, DATA_FILE);
        } catch (_) {
          fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
        }
      } else {
        fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Storage init note:', err.message);
  }
}
initDataStorage();

function readFeedback() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      initDataStorage();
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading feedback data:', err);
    return [];
  }
}

function writeFeedback(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing feedback data:', err);
    return false;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function requestHandler(req, res) {
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, 'http://' + host);
  let pathname = parsedUrl.pathname;

  // Resilient pathname determination (handles proxy/Vercel rewrite headers)
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if (matchedPath && (pathname === '/api' || pathname === '/api/index' || pathname === '/' || pathname.endsWith('/api'))) {
    pathname = matchedPath.split('?')[0];
  }

  // Centralized robust admin key check
  const queryKey = parsedUrl.searchParams.get('key') || (req.query && req.query.key) || '';
  const headerKey = req.headers['x-admin-key'] || '';
  const providedKey = (headerKey || queryKey).toString().trim();
  const isAuthorized = providedKey === ADMIN_KEY.trim();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API ROUTES ---

  // POST /api/feedback: Submit feedback
  if (pathname === '/api/feedback' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2e6) req.destroy(); // 2MB safety limit
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.fullName || !payload.email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Full name and email are required.' }));
          return;
        }

        const isVolunteer = payload.role === 'volunteer';
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const certId = isVolunteer ? 'GAC2-VOL-' + randomNum : 'GAC2-ATT-' + randomNum;
        const attCertId = isVolunteer ? 'GAC2-ATT-' + Math.floor(10000 + Math.random() * 90000) : certId;

        const newEntry = {
          id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          role: payload.role || 'attendee',
          fullName: payload.fullName.trim(),
          email: payload.email.trim().toLowerCase(),
          roleOrProfession: payload.roleOrProfession ? payload.roleOrProfession.trim() : '',
          volunteerTeam: payload.volunteerTeam ? payload.volunteerTeam.trim() : '',
          ratingOverall: Number(payload.ratingOverall) || 5,
          ratingContent: Number(payload.ratingContent) || 5,
          ratingLogistics: Number(payload.ratingLogistics) || 5,
          volunteerExperience: isVolunteer ? (Number(payload.volunteerExperience) || 5) : null,
          favoriteMoment: payload.favoriteMoment ? payload.favoriteMoment.trim() : '',
          improvements: payload.improvements ? payload.improvements.trim() : '',
          volunteerComments: payload.volunteerComments ? payload.volunteerComments.trim() : '',
          recommendScore: Number(payload.recommendScore) || 10,
          certificateId: certId,
          attendanceCertificateId: attCertId,
          volunteerCertificateId: isVolunteer ? certId : null,
          createdAt: new Date().toISOString()
        };

        const feedbacks = readFeedback();
        feedbacks.unshift(newEntry);
        writeFeedback(feedbacks);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Feedback submitted successfully',
          entry: newEntry
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // GET /api/feedback: Admin fetch feedback
  // POST /api/clear: Admin clear all feedback records (for testing)
  if (pathname === '/api/clear' && req.method === 'POST') {
    if (!isAuthorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid Admin Key' }));
      return;
    }

    writeFeedback([]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'All feedback records have been cleared.' }));
    return;
  }

  if (pathname === '/api/feedback' && req.method === 'GET') {
    if (!isAuthorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid Admin Key' }));
      return;
    }

    const feedbacks = readFeedback();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      count: feedbacks.length,
      feedbacks: feedbacks
    }));
    return;
  }

  // GET /api/stats: Aggregate stats for admin dashboard
  if (pathname === '/api/stats' && req.method === 'GET') {
    if (!isAuthorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const feedbacks = readFeedback();
    const total = feedbacks.length;
    const attendees = feedbacks.filter(f => f.role === 'attendee');
    const volunteers = feedbacks.filter(f => f.role === 'volunteer');

    const avgOverall = total > 0 ? (feedbacks.reduce((acc, f) => acc + (f.ratingOverall || 5), 0) / total).toFixed(1) : 0;
    const avgContent = total > 0 ? (feedbacks.reduce((acc, f) => acc + (f.ratingContent || 5), 0) / total).toFixed(1) : 0;
    const avgLogistics = total > 0 ? (feedbacks.reduce((acc, f) => acc + (f.ratingLogistics || 5), 0) / total).toFixed(1) : 0;
    const avgVolunteerExp = volunteers.length > 0 ? (volunteers.reduce((acc, f) => acc + (f.volunteerExperience || 5), 0) / volunteers.length).toFixed(1) : 0;

    const promoters = feedbacks.filter(f => (f.recommendScore || 10) >= 9).length;
    const detractors = feedbacks.filter(f => (f.recommendScore || 10) <= 6).length;
    const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 100;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total: total,
      attendeesCount: attendees.length,
      volunteersCount: volunteers.length,
      avgOverall: avgOverall,
      avgContent: avgContent,
      avgLogistics: avgLogistics,
      avgVolunteerExp: avgVolunteerExp,
      nps: nps
    }));
    return;
  }

  // GET /api/export-csv: Admin download CSV
  if (pathname === '/api/export-csv' && req.method === 'GET') {
    if (!isAuthorized) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }

    const feedbacks = readFeedback();
    const headers = [
      'ID',
      'Date Submitted',
      'Role',
      'Full Name',
      'Email',
      'Profession / Department',
      'Overall Rating (1-5)',
      'Content Rating (1-5)',
      'Logistics Rating (1-5)',
      'Volunteer Experience (1-5)',
      'Recommend Score (1-10)',
      'Favorite Moment',
      'Suggested Improvements',
      'Volunteer Comments',
      'Certificate ID',
      'Attendance Certificate ID'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return '"' + clean + '"';
    };

    const rows = feedbacks.map(f => [
      escapeCsv(f.id),
      escapeCsv(new Date(f.createdAt).toLocaleString()),
      escapeCsv(f.role),
      escapeCsv(f.fullName),
      escapeCsv(f.email),
      escapeCsv(f.role === 'volunteer' ? f.volunteerTeam : f.roleOrProfession),
      f.ratingOverall || '',
      f.ratingContent || '',
      f.ratingLogistics || '',
      f.volunteerExperience || '',
      f.recommendScore || '',
      escapeCsv(f.favoriteMoment),
      escapeCsv(f.improvements),
      escapeCsv(f.volunteerComments),
      escapeCsv(f.certificateId),
      escapeCsv(f.attendanceCertificateId)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="GritinAI_Connect_Feedback_' + new Date().toISOString().slice(0, 10) + '.csv"'
    });
    res.end(csvContent);
    return;
  }

  // GET /api/verify/:certId: Public verification
  if (pathname.startsWith('/api/verify/')) {
    const certId = pathname.replace('/api/verify/', '').trim().toUpperCase();
    const feedbacks = readFeedback();
    const found = feedbacks.find(f => 
      (f.certificateId && f.certificateId.toUpperCase() === certId) ||
      (f.attendanceCertificateId && f.attendanceCertificateId.toUpperCase() === certId) ||
      (f.volunteerCertificateId && f.volunteerCertificateId.toUpperCase() === certId)
    );

    if (found) {
      const isVolCert = found.volunteerCertificateId && found.volunteerCertificateId.toUpperCase() === certId;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        verified: true,
        certificateId: certId,
        recipientName: found.fullName,
        type: isVolCert ? 'Certificate of Volunteer Service' : 'Certificate of Participation & Attendance',
        event: 'GritinAI Connect 2.0',
        issuedDate: new Date(found.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        department: isVolCert ? found.volunteerTeam : null
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ verified: false, error: 'Certificate ID not found' }));
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/volunteer') {
    reqPath = '/volunteer.html';
  } else if (reqPath === '/admin') {
    reqPath = '/admin.html';
  } else if (reqPath === '/verify') {
    reqPath = '/verify.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\\.\\.[\\/\\])+/, '');
  const filePath = path.join(__dirname, 'public', safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

function startServer(port) {
  const server = http.createServer(requestHandler);
  server.listen(port, () => {
    console.log('\n======================================================');
    console.log('🌟 GritinAI Feedback & Certificate Portal is LIVE!');
    console.log('======================================================');
    console.log('📌 Attendee Portal:  http://localhost:' + port + '/');
    console.log('🎖️ Volunteer Portal: http://localhost:' + port + '/volunteer');
    console.log('📊 Admin Dashboard:  http://localhost:' + port + '/admin (Passkey: gritinai2026)');
    console.log('🔍 Verification:    http://localhost:' + port + '/verify');
    console.log('======================================================\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' is in use, trying ' + (port + 1) + '...');
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = requestHandler;
