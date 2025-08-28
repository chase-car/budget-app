/* Simple Budget App - Phase 1
   - Add transactions (date, type, amount, description)
   - List transactions
   - Show totals and balance
   - Persist to localStorage
*/

const STORAGE_KEY = 'budgetApp.transactions';
const CURRENCY = 'USD'; // change if you want a different currency code

let transactions = [];

document.addEventListener('DOMContentLoaded', () => {
  // set date input to today by default
  const dateInput = document.getElementById('date');
  dateInput.value = new Date().toISOString().slice(0,10);

  // load saved transactions and render
  loadTransactions();
  renderTransactions();

  // form submit
  document.getElementById('transaction-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addTransactionFromForm();
  });

  // reset button
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Clear all saved transactions? This cannot be undone.')) {
      transactions = [];
      saveTransactions();
      renderTransactions();
    }
  });
});

function saveTransactions(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadTransactions(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { transactions = []; return; }
  try {
    transactions = JSON.parse(raw);
    if (!Array.isArray(transactions)) transactions = [];
  } catch (err) {
    console.error('Failed to parse saved transactions:', err);
    transactions = [];
  }
}

function addTransactionFromForm(){
  const date = document.getElementById('date').value;
  const type = document.getElementById('type').value; // "income" or "expense"
  const amountStr = document.getElementById('amount').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!amountStr) { alert('Please enter an amount.'); return; }
  const amountNum = Number(amountStr);
  if (!isFinite(amountNum) || amountNum <= 0) { alert('Enter a positive number for amount.'); return; }

  const amountCents = Math.round(amountNum * 100); // store cents as integer

  const tx = {
    id: generateId(),
    date,
    type,
    amountCents, // always positive; type controls sign in UI
    description,
    createdAt: new Date().toISOString()
  };

  transactions.push(tx);
  saveTransactions();
  renderTransactions();

  // clear small fields
  document.getElementById('amount').value = '';
  document.getElementById('description').value = '';
  // reset date to today (optional)
  document.getElementById('date').value = new Date().toISOString().slice(0,10);
}

function renderTransactions(){
  const list = document.getElementById('transactions-list');
  list.innerHTML = '';
  const noTx = document.getElementById('no-transactions');

  if (transactions.length === 0){
    noTx.style.display = 'block';
  } else {
    noTx.style.display = 'none';
  }

  // compute totals
  let totalIncome = 0;
  let totalExpenses = 0;

  document.getElementById('total-income').textContent = formatCents(totalIncome);
  document.getElementById('total-expenses').textContent = formatCents(totalExpenses);

  // Apply color classes
  document.getElementById('total-income').classList.add('total-income');
  document.getElementById('total-expenses').classList.add('total-expenses');


  // show newest first
  const sorted = transactions.slice().sort((a,b) => {
    // compare by date, then createdAt
    if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
    return new Date(b.date) - new Date(a.date);
  });

  for (const tx of sorted){
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.className = 'left';
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = tx.description || '(no description)';
    const d = document.createElement('div');
    d.className = 'date';
    d.textContent = new Date(tx.date).toLocaleDateString();

    left.appendChild(desc);
    left.appendChild(d);

    const right = document.createElement('div');
    right.className = 'right';
    const amountDiv = document.createElement('div');
    amountDiv.className = 'amount';
    const display = formatCents(tx.amountCents);
    if (tx.type === 'income') {
      amountDiv.textContent = `+${display}`;
      amountDiv.classList.add('positive');
      amountDiv.classList.remove('negative');
      totalIncome += tx.amountCents;
    } else {
      amountDiv.textContent = `-${display}`;
      amountDiv.classList.add('negative');
      amountDiv.classList.remove('positive');
      totalExpenses += tx.amountCents;
    }

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.setAttribute('aria-label', 'Delete transaction');
    del.addEventListener('click', () => {
      if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== tx.id);
        saveTransactions();
        renderTransactions();
      }
    });

    right.appendChild(amountDiv);
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  }

  document.getElementById('total-income').textContent = formatCents(totalIncome);
  document.getElementById('total-expenses').textContent = formatCents(totalExpenses);

  const balanceCents = totalIncome - totalExpenses;
  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = formatCents(balanceCents);
  balanceEl.classList.toggle('negative', balanceCents < 0);
  balanceEl.classList.toggle('positive', balanceCents > 0);
}

function formatCents(cents){
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(amount);
}

function generateId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}