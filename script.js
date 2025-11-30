// Protótipo App Barbearia - fluxo com LocalStorage simulando banco de dados.

const STORAGE_KEYS = {
  USER: 'bt_user',
  BOOKINGS: 'bt_bookings',
  BLOCKS: 'bt_blocks',
  BARBERS: 'bt_barbers',
  ADMIN_LOGGED: 'bt_admin_logged'
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentUser() {
  return load(STORAGE_KEYS.USER, null);
}

function setCurrentUser(user) {
  save(STORAGE_KEYS.USER, user);
}

function getBookings() {
  return load(STORAGE_KEYS.BOOKINGS, []);
}

function setBookings(list) {
  save(STORAGE_KEYS.BOOKINGS, list);
}

function getBlocks() {
  return load(STORAGE_KEYS.BLOCKS, []);
}

function setBlocks(list) {
  save(STORAGE_KEYS.BLOCKS, list);
}

function getBarbers() {
  return load(STORAGE_KEYS.BARBERS, []);
}

function setBarbers(list) {
  save(STORAGE_KEYS.BARBERS, list);
}

// ID simples
function genId() {
  return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
}

// Slots (regras de horário)
function generateSlotsForDate(dateStr) {
  if (!dateStr) return [];

  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 = domingo, 1 = segunda ... 6 = sábado

  if (day === 0) {
    return []; // domingo fechado
  }

  let startHour = 7;
  let endHour = 18;
  if (day === 6) {
    endHour = 13; // sábado 7-13
  }

  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      if (h === 12) continue; // pula almoço
      slots.push(hh + ':' + mm);
    }
  }
  return slots;
}

// Bloqueios
function isBlocked(dateStr, timeStr) {
  const blocks = getBlocks();
  return blocks.some(b => {
    if (b.date !== dateStr) return false;
    if (!b.time) return true; // dia todo
    if (!timeStr) return false;
    return b.time === timeStr;
  });
}

// Params
function getParam(name, fallback = '') {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || fallback;
}

// Logout cliente
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = 'login.html';
}

// Logout admin
function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED);
  window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  // Proteção de rotas do cliente
  const clientProtected = ['home', 'horario', 'confirmacao', 'agendamentos'];
  if (clientProtected.includes(page)) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
  }

  // Proteção de rota admin
  if (page === 'admin') {
    const adminLogged = localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED);
    if (adminLogged !== '1') {
      window.location.href = 'admin-login.html';
      return;
    }
  }

  // CADASTRO
  if (page === 'cadastro') {
    const form = document.getElementById('form-cadastro');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const celular = document.getElementById('celular').value.trim();
      const cpf = document.getElementById('cpf').value.trim();
      const senha = document.getElementById('senha').value.trim();

      if (!nome || !email || !celular || !cpf || !senha) {
        alert('Preencha todos os campos.');
        return;
      }

      if (!email.includes('@') || !email.includes('.')) {
        alert('Informe um e-mail válido.');
        return;
      }

      setCurrentUser({ nome, email });
      alert('Cadastro realizado (simulado). Agora faça login.');
      window.location.href = 'login.html';
    });
  }

  // LOGIN + 2 FATORES
  if (page === 'login') {
    const form = document.getElementById('form-login');
    const btnEsqueci = document.getElementById('btn-esqueci');

    btnEsqueci?.addEventListener('click', () => {
      const email = document.getElementById('email').value.trim();
      if (!email) {
        alert('Digite seu e-mail para recuperar a senha (simulado).');
      } else {
        alert('Um link de recuperação foi enviado para ' + email + ' (simulado).');
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value.trim();

      if (!email || !senha) {
        alert('Informe e-mail e senha.');
        return;
      }

      if (!email.includes('@') || !email.includes('.')) {
        alert('Informe um e-mail válido.');
        return;
      }

      const user = getCurrentUser();
      if (!user || user.email !== email) {
        alert('Usuário não encontrado no cadastro (protótipo seguirá assim mesmo).');
      }

      alert('Código de 2º fator enviado para seu e-mail (simulado).');
      window.location.href = 'twofactor.html?email=' + encodeURIComponent(email);
    });
  }

  if (page === 'twofactor') {
    const form = document.getElementById('form-2fa');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const codigo = document.getElementById('codigo').value.trim();
      if (codigo.length !== 6) {
        alert('Digite um código de 6 dígitos.');
        return;
      }
      const email = getParam('email', '');
      const stored = getCurrentUser() || {};
      const nome = stored.nome || 'Cliente';
      setCurrentUser({ nome, email });
      window.location.href = 'home.html';
    });
  }

  // HOME
  if (page === 'home') {
    const user = getCurrentUser();
    const spanNome = document.getElementById('home-nome');
    if (user && spanNome) {
      const firstName = user.nome ? user.nome.trim().split(' ')[0] : 'Cliente';
      spanNome.textContent = 'Bem-vindo, ' + firstName + '!';
    }

    const btnLogout = document.getElementById('btn-logout');
    btnLogout?.addEventListener('click', logoutUser);
  }

  // SELEÇÃO DE HORÁRIO
  if (page === 'horario') {
    const servico = getParam('servico', 'Corte');
    const preco = getParam('preco', '25');
    const pServ = document.getElementById('horario-servico');
    if (pServ) {
      pServ.textContent = 'Serviço: ' + servico + ' • R$ ' + preco + ',00';
    }

    const dataInput = document.getElementById('data');
    const listaHorarios = document.getElementById('lista-horarios');
    const hiddenHora = document.getElementById('hora');

    function atualizarHorarios() {
      const data = dataInput.value;
      listaHorarios.innerHTML = '';
      hiddenHora.value = '';

      if (!data) return;

      const slots = generateSlotsForDate(data);
      if (!slots.length) {
        const day = new Date(data + 'T00:00:00').getDay();
        if (day === 0) {
          listaHorarios.innerHTML = '<span class="tag">Domingo: não há atendimento.</span>';
        } else {
          listaHorarios.innerHTML = '<span class="tag">Nenhum horário disponível nesta data.</span>';
        }
        return;
      }

      slots.forEach(h => {
        const blocked = isBlocked(data, h);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = h;
        btn.className = 'time-pill';
        if (blocked) {
          btn.disabled = true;
          btn.style.opacity = '0.3';
          btn.title = 'Horário bloqueado';
        }
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          document.querySelectorAll('.time-pill').forEach(p => p.classList.remove('selected'));
          btn.classList.add('selected');
          hiddenHora.value = h;
        });
        listaHorarios.appendChild(btn);
      });
    }

    dataInput?.addEventListener('change', atualizarHorarios);

    const form = document.getElementById('form-horario');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = dataInput.value;
      const hora = hiddenHora.value;

      if (!data || !hora) {
        alert('Selecione uma data e um horário.');
        return;
      }

      const params = new URLSearchParams({
        servico,
        preco,
        data,
        hora
      });
      window.location.href = 'confirmacao.html?' + params.toString();
    });
  }

  // CONFIRMAÇÃO
  if (page === 'confirmacao') {
    const servico = getParam('servico', 'Corte');
    const preco = getParam('preco', '25');
    const data = getParam('data', '');
    const hora = getParam('hora', '');
    const user = getCurrentUser();

    const elServ = document.getElementById('conf-servico');
    const elData = document.getElementById('conf-data');
    const elHora = document.getElementById('conf-hora');
    const elPreco = document.getElementById('conf-preco');
    const elEmail = document.getElementById('conf-email');

    if (elServ) elServ.textContent = servico;
    if (elPreco) elPreco.textContent = 'R$ ' + preco + ',00';
    if (elEmail && user?.email) elEmail.textContent = 'Cliente: ' + user.nome + ' • ' + user.email;

    if (data && elData) {
      const [y, m, d] = data.split('-');
      elData.textContent = d + '/' + m + '/' + y;
    }
    if (hora && elHora) elHora.textContent = hora;

    const form = document.getElementById('form-confirmacao');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const bookings = getBookings();
      bookings.push({
        id: genId(),
        servico,
        preco: Number(preco),
        data,
        hora,
        cliente: user?.nome || 'Cliente',
        email: user?.email || '',
        barbeiro: 'Padrão',
        status: 'agendado',
        pago: false,
        criadoEm: new Date().toISOString()
      });
      setBookings(bookings);
      alert('Agendamento confirmado!');
      window.location.href = 'agendamentos.html';
    });
  }

  // MEUS AGENDAMENTOS
  if (page === 'agendamentos') {
    const listaFuturos = document.getElementById('lista-futuros');
    const listaPassados = document.getElementById('lista-passados');
    const bookings = getBookings();

    const agora = new Date();

    function buildCard(b) {
      const card = document.createElement('article');
      card.className = 'card';

      const header = document.createElement('div');
      header.className = 'card-header';
      const spanServ = document.createElement('span');
      spanServ.textContent = b.servico;
      const spanDataHora = document.createElement('span');
      spanDataHora.className = 'badge';
      const [y, m, d] = b.data.split('-');
      spanDataHora.textContent = `${d}/${m}/${y} • ${b.hora}`;
      header.appendChild(spanServ);
      header.appendChild(spanDataHora);

      const pStatus = document.createElement('p');
      pStatus.className = 'tag';
      pStatus.textContent = 'Status: ' + b.status + (b.pago ? ' • Pago' : '');

      card.appendChild(header);
      card.appendChild(pStatus);

      if (b.status !== 'cancelado') {
        const btnRow = document.createElement('div');
        btnRow.style.marginTop = '8px';
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'flex-end';
        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn btn-secondary';
        btnCancel.textContent = 'Cancelar';
        btnCancel.addEventListener('click', () => {
          const all = getBookings();
          const found = all.find(x => x.id === b.id);
          if (found) {
            found.status = 'cancelado';
            setBookings(all);
            window.location.reload();
          }
        });
        btnRow.appendChild(btnCancel);
        card.appendChild(btnRow);
      }

      return card;
    }

    bookings.forEach(b => {
      if (!b.data || !b.hora) return;
      const dataHora = new Date(b.data + 'T' + b.hora + ':00');
      const target = dataHora >= agora ? listaFuturos : listaPassados;
      target.appendChild(buildCard(b));
    });

    if (!listaFuturos.hasChildNodes()) {
      listaFuturos.innerHTML = '<p class="tag">Nenhum agendamento futuro.</p>';
    }
    if (!listaPassados.hasChildNodes()) {
      listaPassados.innerHTML = '<p class="tag">Nenhum agendamento passado.</p>';
    }
  }

  // ADMIN LOGIN
  if (page === 'admin-login') {
    const form = document.getElementById('form-admin-login');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const senha = document.getElementById('admin-senha').value.trim();
      if (email === 'admin@barbearia.com' && senha === '123456') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED, '1');
        window.location.href = 'admin.html';
      } else {
        alert('Credenciais inválidas. Use admin@barbearia.com / 123456 (protótipo).');
      }
    });
  }

  // ADMIN PAINEL
  if (page === 'admin') {
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    btnAdminLogout?.addEventListener('click', logoutAdmin);

    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        tabs.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
      });
    });

    let barbers = getBarbers();
    if (!barbers.length) {
      barbers = [
        { id: genId(), nome: 'Barbeiro 1' },
        { id: genId(), nome: 'Barbeiro 2' }
      ];
      setBarbers(barbers);
    }

    const contAg = document.getElementById('admin-lista-agendamentos');
    const filtroData = document.getElementById('filtro-data');

    function renderAdminAgendamentos() {
      const dataFiltro = filtroData.value;
      const list = getBookings();
      if (!list.length) {
        contAg.innerHTML = '<p class="tag">Nenhum agendamento cadastrado.</p>';
        return;
      }
      let html = '<table class="table"><thead><tr><th>Data</th><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Status</th></tr></thead><tbody>';
      list.forEach(b => {
        if (dataFiltro && b.data !== dataFiltro) return;
        const [y, m, d] = b.data.split('-');
        html += `<tr>
          <td>${d}/${m}/${y}</td>
          <td>${b.hora}</td>
          <td>${b.cliente}</td>
          <td>${b.servico}</td>
          <td>${b.status}${b.pago ? ' • Pago' : ''}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      contAg.innerHTML = html;
    }
    filtroData?.addEventListener('change', renderAdminAgendamentos);
    renderAdminAgendamentos();

    const contFinResumo = document.getElementById('admin-financeiro-resumo');
    const contFinLista = document.getElementById('admin-financeiro-lista');

    function renderFinanceiro() {
      const list = getBookings();
      if (!list.length) {
        contFinResumo.textContent = 'Nenhum agendamento cadastrado.';
        contFinLista.innerHTML = '';
        return;
      }

      const total = list.reduce((s, b) => s + (b.preco || 0), 0);
      const totalPago = list.filter(b => b.pago).reduce((s, b) => s + (b.preco || 0), 0);
      const pendente = total - totalPago;

      contFinResumo.textContent = `Total: R$ ${total.toFixed(2)} • Pago: R$ ${totalPago.toFixed(2)} • Pendente: R$ ${pendente.toFixed(2)}`;

      let html = '<table class="table"><thead><tr><th>Data</th><th>Serviço</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>';
      list.forEach(b => {
        const [y, m, d] = b.data.split('-');
        html += `<tr>
          <td>${d}/${m}/${y}</td>
          <td>${b.servico}</td>
          <td>R$ ${b.preco?.toFixed(2) || '0,00'}</td>
          <td>${b.pago ? '<span class="chip pago">Pago</span>' : '<span class="chip">Pendente</span>'}</td>
          <td><button data-id="${b.id}" class="btn btn-secondary btn-marcar-pago">${b.pago ? 'Desmarcar' : 'Marcar pago'}</button></td>
        </tr>`;
      });
      html += '</tbody></table>';
      contFinLista.innerHTML = html;

      contFinLista.querySelectorAll('.btn-marcar-pago').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const all = getBookings();
          const found = all.find(x => x.id === id);
          if (found) {
            found.pago = !found.pago;
            setBookings(all);
            renderFinanceiro();
          }
        });
      });
    }
    renderFinanceiro();

    const formBloq = document.getElementById('form-bloqueio');
    const listaBloq = document.getElementById('lista-bloqueios');

    function renderBloqueios() {
      const blocks = getBlocks();
      if (!blocks.length) {
        listaBloq.innerHTML = '<p class="tag">Nenhum bloqueio cadastrado.</p>';
        return;
      }
      let html = '';
      blocks.forEach((b, idx) => {
        const [y, m, d] = b.date.split('-');
        const label = b.time ? `${d}/${m}/${y} • ${b.time}` : `${d}/${m}/${y} (dia todo)`;
        html += `<div class="tag">• ${label} <button data-i="${idx}" class="btn-ghost">Remover</button></div>`;
      });
      listaBloq.innerHTML = html;
      listaBloq.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-i'));
          const blocks = getBlocks();
          blocks.splice(i, 1);
          setBlocks(blocks);
          renderBloqueios();
        });
      });
    }

    formBloq?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = document.getElementById('bloq-data').value;
      const hora = document.getElementById('bloq-hora').value;
      if (!data) {
        alert('Informe a data para bloqueio.');
        return;
      }
      const blocks = getBlocks();
      blocks.push({ date: data, time: hora || null });
      setBlocks(blocks);
      renderBloqueios();
      e.target.reset();
    });
    renderBloqueios();

    const formBarbeiro = document.getElementById('form-barbeiro');
    const listaBarbeiros = document.getElementById('lista-barbeiros');
    const selectManualBarbeiro = document.getElementById('m-barbeiro');

    function renderBarbeiros() {
      const list = getBarbers();
      if (!list.length) {
        listaBarbeiros.innerHTML = '<p class="tag">Nenhum barbeiro cadastrado.</p>';
      } else {
        let html = '';
        list.forEach(b => {
          html += `<div class="tag">• ${b.nome}</div>`;
        });
        listaBarbeiros.innerHTML = html;
      }

      if (selectManualBarbeiro) {
        selectManualBarbeiro.innerHTML = '';
        list.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = b.nome;
          selectManualBarbeiro.appendChild(opt);
        });
      }
    }

    formBarbeiro?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('barbeiro-nome').value.trim();
      if (!nome) return;
      const list = getBarbers();
      list.push({ id: genId(), nome });
      setBarbers(list);
      renderBarbeiros();
      e.target.reset();
    });

    renderBarbeiros();

    const formManual = document.getElementById('form-agendamento-manual');
    formManual?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('m-nome').value.trim();
      const servico = document.getElementById('m-servico').value.trim();
      const data = document.getElementById('m-data').value;
      const hora = document.getElementById('m-hora').value;
      const barberId = document.getElementById('m-barbeiro').value;

      if (!nome || !servico || !data || !hora || !barberId) {
        alert('Preencha todos os campos.');
        return;
      }

      const barbers = getBarbers();
      const barber = barbers.find(b => b.id === barberId);
      const bookings = getBookings();
      bookings.push({
        id: genId(),
        servico,
        preco: 0,
        data,
        hora,
        cliente: nome,
        email: '',
        barbeiro: barber ? barber.nome : 'Barbeiro',
        status: 'agendado',
        pago: false,
        criadoEm: new Date().toISOString()
      });
      setBookings(bookings);
      alert('Agendamento criado com sucesso.');
      renderAdminAgendamentos();
      renderFinanceiro();
      e.target.reset();
    });
  }
});
