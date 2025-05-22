const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');

const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const hourSelect = document.getElementById('hourSelect');
const minuteSelect = document.getElementById('minuteSelect');
const hiddenInput = document.getElementById('taskDateTime');

let selectedDate = null;
let currentYear, currentMonth; // para controle do calendário

const now = new Date();

function init() {
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  createCalendar(currentYear, currentMonth);
  populateTimeSelectors();
  setupNavigation();
  setupForm();
}

function setupForm() {
  taskForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('taskName').value.trim();
    const desc = document.getElementById('taskDesc').value.trim();
    const datetime = hiddenInput.value;

    if (!name) {
      alert('Nome da tarefa é obrigatório!');
      return;
    }
    if (!datetime) {
      alert('Data e hora são obrigatórios!');
      return;
    }

    addTask({ name, desc, datetime });

    taskForm.reset();

    // Reseta para mês e ano atuais após inserir a tarefa
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    createCalendar(currentYear, currentMonth);
    populateTimeSelectors();
    updateHiddenDateTime();
  });
}

function setupNavigation() {
  prevMonthBtn.addEventListener('click', () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    // Não deixa ir para meses antes do atual (limita a hoje)
    if (
      newYear < now.getFullYear() ||
      (newYear === now.getFullYear() && newMonth < now.getMonth())
    ) {
      return;
    }

    currentMonth = newMonth;
    currentYear = newYear;

    createCalendar(currentYear, currentMonth);
    updateHiddenDateTime();
  });

  nextMonthBtn.addEventListener('click', () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    // Sem limite superior aqui (pode navegar para qualquer futuro)
    currentMonth = newMonth;
    currentYear = newYear;

    createCalendar(currentYear, currentMonth);
    updateHiddenDateTime();
  });
}

function createCalendar(year, month) {
  calendar.innerHTML = '';
  monthYear.textContent = `${getMonthName(month)} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Ajusta o dia da semana para segunda = 0 ... domingo = 6
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  // Cria células vazias até o primeiro dia do mês
  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement('div');
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.textContent = day;

    // Data desse dia para comparações
    const dateCandidate = new Date(year, month, day);

    // Bloquear dias antes de hoje
    if (isBeforeDay(dateCandidate, now)) {
      dayEl.classList.add('disabled');
    }

    dayEl.addEventListener('click', () => {
      if (dayEl.classList.contains('disabled')) return;

      selectDay(dayEl, year, month, day);
    });

    calendar.appendChild(dayEl);
  }

  // Se o mês/ano é atual, seleciona o dia atual automaticamente (se não for passado ainda)
  if (year === now.getFullYear() && month === now.getMonth()) {
    const todayCell = [...calendar.children].find(
      (c) => c.textContent == now.getDate() && !c.classList.contains('disabled')
    );
    if (todayCell) {
      todayCell.click();
    }
  } else {
    // Se o mês/ano é futuro e não selecionou nada ainda, limpa seleção
    selectedDate = null;
    updateHiddenDateTime();
  }
}

function isBeforeDay(date1, date2) {
  // Compara só ano, mês e dia, sem hora
  return (
    date1.getFullYear() < date2.getFullYear() ||
    (date1.getFullYear() === date2.getFullYear() && date1.getMonth() < date2.getMonth()) ||
    (date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() < date2.getDate())
  );
}

function selectDay(dayEl, year, month, day) {
  [...calendar.children].forEach((el) => el.classList.remove('selected'));
  dayEl.classList.add('selected');

  selectedDate = new Date(year, month, day);

  // Ao selecionar um dia, ajusta as horas/minutos para desabilitar opções anteriores caso seja hoje
  updateTimeSelectorsBasedOnDate();

  updateHiddenDateTime();
}

function getMonthName(month) {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[month];
}

function populateTimeSelectors() {
  hourSelect.innerHTML = '';
  minuteSelect.innerHTML = '';

  for (let h = 0; h < 24; h++) {
    const option = document.createElement('option');
    option.value = h;
    option.textContent = h.toString().padStart(2, '0');
    hourSelect.appendChild(option);
  }

  for (let m = 0; m < 60; m += 5) {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m.toString().padStart(2, '0');
    minuteSelect.appendChild(option);
  }

  // Adiciona event listeners para atualizar a data e hora selecionada
  hourSelect.addEventListener('change', () => {
    // Se horário inválido, corrige
    validateTimeSelection();
    updateHiddenDateTime();
  });
  minuteSelect.addEventListener('change', () => {
    validateTimeSelection();
    updateHiddenDateTime();
  });
}

function updateTimeSelectorsBasedOnDate() {
  if (!selectedDate) return;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  if (selectedDay.getTime() === today.getTime()) {
    // É hoje, então bloqueia horas anteriores à hora atual
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Atualiza opções de horas
    [...hourSelect.options].forEach((opt) => {
      if (parseInt(opt.value) < currentHour) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });

    // Se hora selecionada for menor que hora atual, muda para hora atual
    if (parseInt(hourSelect.value) < currentHour) {
      hourSelect.value = currentHour;
    }

    // Atualiza minutos conforme hora selecionada
    updateMinuteOptions(currentHour, currentMinute);
  } else {
    // Não é hoje, habilita tudo
    [...hourSelect.options].forEach((opt) => (opt.disabled = false));
    [...minuteSelect.options].forEach((opt) => (opt.disabled = false));

    // Ajusta hora e minuto para zero se nenhum selecionado ainda
    if (!hourSelect.value) hourSelect.value = 0;
    if (!minuteSelect.value) minuteSelect.value = 0;
  }
}

function updateMinuteOptions(currentHour, currentMinute) {
  const selectedHour = parseInt(hourSelect.value);

  [...minuteSelect.options].forEach((opt) => {
    const val = parseInt(opt.value);
    if (selectedHour === currentHour && val < currentMinute) {
      opt.disabled = true;
    } else {
      opt.disabled = false;
    }
  });

  // Se minuto selecionado for menor que atual e hora é atual, corrige
  if (
    selectedHour === currentHour &&
    parseInt(minuteSelect.value) < currentMinute
  ) {
    minuteSelect.value = currentMinute;
  }
}

function validateTimeSelection() {
  if (!selectedDate) return;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  if (selectedDay.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (parseInt(hourSelect.value) < currentHour) {
      hourSelect.value = currentHour;
    }

    if (
      parseInt(hourSelect.value) === currentHour &&
      parseInt(minuteSelect.value) < currentMinute
    ) {
      minuteSelect.value = currentMinute;
    }
  }
}

function updateHiddenDateTime() {
  if (!selectedDate) {
    hiddenInput.value = '';
    return;
  }

  let year = selectedDate.getFullYear();
  let month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
  let day = selectedDate.getDate().toString().padStart(2, '0');

  let hour = hourSelect.value !== '' ? hourSelect.value.toString().padStart(2, '0') : '00';
  let minute = minuteSelect.value !== '' ? minuteSelect.value.toString().padStart(2, '0') : '00';

  hiddenInput.value = `${year}-${month}-${day}T${hour}:${minute}`;
}

function addTask({ name, desc, datetime }) {
  const li = document.createElement('li');

  const taskName = document.createElement('div');
  taskName.className = 'task-name';
  taskName.textContent = name;

  const taskDesc = document.createElement('div');
  taskDesc.className = 'task-desc';
  taskDesc.textContent = desc;

  const taskDatetime = document.createElement('div');
  taskDatetime.className = 'task-datetime';
  taskDatetime.textContent = formatDateTime(datetime);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn btn-toggle';
  toggleBtn.textContent = 'Marcar como concluída';

  toggleBtn.addEventListener('click', () => {
    li.classList.toggle('completed');
    if (li.classList.contains('completed')) {
      toggleBtn.textContent = 'Desmarcar tarefa';
      toggleBtn.classList.add('completed');
    } else {
      toggleBtn.textContent = 'Marcar como concluída';
      toggleBtn.classList.remove('completed');
    }
  });

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-edit';
  editBtn.textContent = 'Editar';

  editBtn.addEventListener('click', () => {
    alert('Funcionalidade de editar não implementada nesta versão.');
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = 'Excluir';

  deleteBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      taskList.removeChild(li);
    }
  });

  actions.appendChild(toggleBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(taskName);
  if (desc) li.appendChild(taskDesc);
  li.appendChild(taskDatetime);
  li.appendChild(actions);

  taskList.appendChild(li);
}

function formatDateTime(datetime) {
  // datetime no formato yyyy-mm-ddThh:mm
  const [datePart, timePart] = datetime.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

init();
                                                                                                                                                        