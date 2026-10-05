// Organizer Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
  let currentKey = localStorage.getItem('gac_admin_key') || '';

  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const headerAuthActions = document.getElementById('headerAuthActions');
  const pinInput = document.getElementById('adminPin');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  // Stats elements
  const statTotal = document.getElementById('statTotal');
  const statAttendees = document.getElementById('statAttendees');
  const statVolunteers = document.getElementById('statVolunteers');
  const statRating = document.getElementById('statRating');

  // Table & Controls
  const searchInput = document.getElementById('searchInput');
  const roleFilter = document.getElementById('roleFilter');
  const teamFilter = document.getElementById('teamFilter');
  const tableBody = document.getElementById('feedbackTableBody');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const clearRecordsBtn = document.getElementById('clearRecordsBtn');

  // Modal
  const detailModal = document.getElementById('detailModal');
  const modalContent = document.getElementById('modalContent');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  let allFeedbacks = [];

  // Check existing session
  if (currentKey) {
    verifyAndLoad(currentKey);
  }

  loginBtn.addEventListener('click', () => {
    const key = pinInput.value.trim();
    if (!key) {
      showLoginError('Please enter the organizer passkey.');
      return;
    }
    verifyAndLoad(key);
  });

  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('gac_admin_key');
      currentKey = '';
      dashboardSection.classList.add('hidden');
      headerAuthActions.classList.add('hidden');
      loginSection.classList.remove('hidden');
      pinInput.value = '';
    });
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
  }

  async function verifyAndLoad(key) {
    loginError.classList.add('hidden');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Verifying...';

    try {
      const res = await fetch('/api/stats?key=' + encodeURIComponent(key));
      if (!res.ok) {
        throw new Error('Invalid Organizer Passkey');
      }

      currentKey = key;
      localStorage.setItem('gac_admin_key', key);

      loginSection.classList.add('hidden');
      dashboardSection.classList.remove('hidden');
      if (headerAuthActions) headerAuthActions.classList.remove('hidden');

      await loadDashboardData();
    } catch (err) {
      showLoginError('Access Denied: Invalid Passkey');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Unlock Dashboard';
    }
  }

  async function loadDashboardData() {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/stats?key=' + encodeURIComponent(currentKey));
      const stats = await statsRes.json();

      statTotal.textContent = stats.total || 0;
      statAttendees.textContent = stats.attendeesCount || 0;
      statVolunteers.textContent = stats.volunteersCount || 0;
      statRating.textContent = stats.avgOverall ? (stats.avgOverall + ' / 5.0') : '0.0 / 5.0';

      // 2. Fetch Feedbacks
      const fbRes = await fetch('/api/feedback?key=' + encodeURIComponent(currentKey));
      const fbData = await fbRes.json();
      allFeedbacks = fbData.feedbacks || [];

      renderTable();
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }

  function renderTable() {
    const query = searchInput.value.toLowerCase().trim();
    const roleVal = roleFilter.value;
    const teamVal = teamFilter ? teamFilter.value : 'all';

    const filtered = allFeedbacks.filter(item => {
      const matchRole = roleVal === 'all' || item.role === roleVal;
      const matchTeam = teamVal === 'all' || (item.role === 'volunteer' && item.volunteerTeam === teamVal);

      const matchSearch = !query || 
        (item.fullName && item.fullName.toLowerCase().includes(query)) ||
        (item.email && item.email.toLowerCase().includes(query)) ||
        (item.certificateId && item.certificateId.toLowerCase().includes(query)) ||
        (item.volunteerTeam && item.volunteerTeam.toLowerCase().includes(query));

      return matchRole && matchTeam && matchSearch;
    });

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 48px 24px; color: var(--text-grey); font-family: var(--font-mono); font-size: 15px;">
            No responses match your search or filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      const isVol = item.role === 'volunteer';
      
      const roleBadge = isVol
        ? `<span class="badge-role badge-volunteer">VOLUNTEER</span><div class="admin-team-sub">${item.volunteerTeam || 'Volunteer Team'}</div>`
        : `<span class="badge-role badge-attendee">ATTENDEE</span>`;

      const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const ratingScore = item.ratingOverall || 5;

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 13.5px; color: var(--text-grey); white-space: nowrap;">
          ${dateStr}
        </td>
        <td>
          <div class="admin-participant-name">${item.fullName}</div>
          <div class="admin-participant-email">${item.email}</div>
        </td>
        <td>${roleBadge}</td>
        <td>
          <span class="admin-rating-badge">★ ${ratingScore} / 5</span>
        </td>
        <td>
          <span class="admin-cert-id">${item.certificateId || 'N/A'}</span>
        </td>
        <td>
          <button type="button" class="btn-action btn-secondary view-btn" style="width: auto; padding: 7px 14px; font-size: 13.5px;" data-id="${item.id}">
            View Feedback
          </button>
        </td>
      `;

      tr.querySelector('.view-btn').addEventListener('click', () => openModal(item));
      tableBody.appendChild(tr);
    });
  }

  function openModal(item) {
    const isVol = item.role === 'volunteer';

    modalContent.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">Participant</div>
        <div class="detail-val">
          <strong>${item.fullName}</strong> &lt;${item.email}&gt;
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Role / Category</div>
        <div class="detail-val">
          <strong>${isVol ? 'Volunteer' : 'Conference Attendee'}</strong>
          ${isVol && item.volunteerTeam ? ` — Team: <strong>${item.volunteerTeam}</strong>` : ''}
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Experience Rating</div>
        <div class="detail-val">
          Overall Score: <strong>${item.ratingOverall || 5} / 5</strong>
          ${isVol && item.volunteerExperience ? ` | Volunteer Experience: <strong>${item.volunteerExperience} / 5</strong>` : ''}
        </div>
      </div>

      ${item.favoriteMoment ? `
      <div class="detail-row">
        <div class="detail-label">What did you enjoy most?</div>
        <div class="detail-val detail-bubble">${item.favoriteMoment}</div>
      </div>
      ` : ''}

      ${item.improvements ? `
      <div class="detail-row">
        <div class="detail-label">Suggestions for Next Time</div>
        <div class="detail-val detail-bubble">${item.improvements}</div>
      </div>
      ` : ''}

      ${item.volunteerComments ? `
      <div class="detail-row">
        <div class="detail-label">Volunteer Team Feedback</div>
        <div class="detail-val detail-bubble">${item.volunteerComments}</div>
      </div>
      ` : ''}

      <div class="detail-row" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
        <div class="detail-label">Certificate Credentials</div>
        <div class="detail-val" style="font-family: var(--font-mono); font-size: 14px;">
          Certificate ID: <strong style="color: var(--blue);">${item.certificateId}</strong><br>
          <a href="/verify?id=${encodeURIComponent(item.certificateId)}" target="_blank" style="color: var(--blue); text-decoration: underline; display: inline-block; margin-top: 6px;">
            Open Public Verification Page &rarr;
          </a>
        </div>
      </div>
    `;

    detailModal.classList.add('open');
  }

  modalCloseBtn.addEventListener('click', () => {
    detailModal.classList.remove('open');
  });

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal.classList.contains('open')) {
      detailModal.classList.remove('open');
    }
  });

  searchInput.addEventListener('input', renderTable);
  roleFilter.addEventListener('change', () => {
    if (teamFilter) {
      teamFilter.disabled = roleFilter.value === 'attendee';
    }
    renderTable();
  });
  if (teamFilter) teamFilter.addEventListener('change', renderTable);
  refreshBtn.addEventListener('click', loadDashboardData);

  // Export CSV
  
  // Clear All Records (For testing)
  if (clearRecordsBtn) {
    clearRecordsBtn.addEventListener('click', async () => {
      const confirmMsg = "Are you sure you want to permanently clear all feedback records?\n\nThis will remove all attendee and volunteer responses currently stored.";
      if (!confirm(confirmMsg)) return;

      clearRecordsBtn.disabled = true;
      clearRecordsBtn.textContent = 'Clearing...';

      try {
        const res = await fetch('/api/clear?key=' + encodeURIComponent(currentKey), {
          method: 'POST'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to clear records');

        alert('Success: All feedback records have been cleared.');
        await loadDashboardData();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        clearRecordsBtn.disabled = false;
        clearRecordsBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: text-bottom; margin-right: 6px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Clear All Records`;
      }
    });
  }
  
  exportCsvBtn.addEventListener('click', () => {
    window.location.href = '/api/export-csv?key=' + encodeURIComponent(currentKey);
  });
});
