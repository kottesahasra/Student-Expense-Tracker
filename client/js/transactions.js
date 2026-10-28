document.addEventListener('DOMContentLoaded', async () => {
  Auth.renderUserNav();

  let currentPage = 0;
  const pageSize = 15;
  let totalCount = 0;
  let categoriesList = [];

  const tbody = document.getElementById('transactions-tbody');
  const searchInput = document.getElementById('search-input');
  const typeFilter = document.getElementById('type-filter');
  const categoryFilter = document.getElementById('category-filter');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  const pageIndicator = document.getElementById('page-indicator');

  // Load categories
  async function loadCategories() {
    try {
      const res = await Api.get('/categories');
      if (res.data) {
        categoriesList = res.data;
        const filterSelect = document.getElementById('category-filter');
        const modalSelect = document.getElementById('tx-category');

        if (filterSelect) {
          filterSelect.innerHTML = '<option value="">All Categories</option>';
          categoriesList.forEach(c => {
            filterSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
          });
        }

        if (modalSelect) {
          modalSelect.innerHTML = '<option value="">Select Category</option>';
          categoriesList.forEach(c => {
            modalSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
          });
        }
      }
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  }

  // Load transactions list
  async function loadTransactions() {
    const params = {
      limit: pageSize,
      offset: currentPage * pageSize
    };

    if (searchInput?.value.trim()) params.search = searchInput.value.trim();
    if (typeFilter?.value) params.type = typeFilter.value;
    if (categoryFilter?.value) params.categoryId = categoryFilter.value;

    try {
      const res = await Api.get('/transactions', params);
      if (res.data) {
        totalCount = res.data.total;
        renderTransactions(res.data.transactions);
        updatePagination();
      }
    } catch (err) {
      Utils.showToast('Failed to load transactions: ' + err.message, 'error');
    }
  }

  function renderTransactions(transactions) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-6">No transactions found matching your criteria.</td></tr>';
      return;
    }

    transactions.forEach(tx => {
      const isExpense = tx.type === 'expense';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${tx.title}</strong></td>
        <td>
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${tx.categories?.color || '#94a3b8'}; margin-right:6px;"></span>
          ${tx.categories?.name || 'Uncategorized'}
        </td>
        <td>${Utils.formatDate(tx.date)}</td>
        <td>
          <span class="badge ${isExpense ? 'badge-expense' : 'badge-income'}">
            ${isExpense ? 'Expense' : 'Income'}
          </span>
        </td>
        <td class="font-bold ${isExpense ? 'text-danger' : 'text-success'}">
          ${isExpense ? '-' : '+'}${Utils.formatCurrency(tx.amount)}
        </td>
        <td class="text-right">
          <button class="btn btn-secondary btn-sm" onclick="editTransaction('${tx.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTransaction('${tx.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function updatePagination() {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    if (pageIndicator) pageIndicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage + 1 >= totalPages;
  }

  // Filter events
  if (searchInput) searchInput.addEventListener('input', Utils.debounce(loadTransactions, 300));
  if (typeFilter) typeFilter.addEventListener('change', () => { currentPage = 0; loadTransactions(); });
  if (categoryFilter) categoryFilter.addEventListener('change', () => { currentPage = 0; loadTransactions(); });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        loadTransactions();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalCount / pageSize);
      if (currentPage + 1 < totalPages) {
        currentPage++;
        loadTransactions();
      }
    });
  }

  // Transaction form create/update
  const modalForm = document.getElementById('transaction-form');
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('tx-id').value;
      const title = document.getElementById('tx-title').value.trim();
      const amount = parseFloat(document.getElementById('tx-amount').value);
      const type = document.getElementById('tx-type').value;
      const category_id = document.getElementById('tx-category').value || null;
      const date = document.getElementById('tx-date').value || new Date().toISOString().split('T')[0];
      const description = document.getElementById('tx-description').value.trim();

      const payload = { title, amount, type, category_id, date, description };

      try {
        if (id) {
          await Api.put(`/transactions/${id}`, payload);
          Utils.showToast('Transaction updated successfully!', 'success');
        } else {
          await Api.post('/transactions', payload);
          Utils.showToast('Transaction added successfully!', 'success');
        }
        Utils.closeModal('transaction-modal');
        modalForm.reset();
        document.getElementById('tx-id').value = '';
        await loadTransactions();
      } catch (err) {
        Utils.showToast(err.message || 'Operation failed', 'error');
      }
    });
  }

  // Export to CSV
  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const res = await Api.get('/transactions', { limit: 1000 });
        const list = res.data?.transactions || [];
        if (list.length === 0) {
          Utils.showToast('No transactions to export', 'info');
          return;
        }

        const headers = ['Title', 'Category', 'Date', 'Type', 'Amount', 'Description'];
        const rows = list.map(t => [
          `"${t.title.replace(/"/g, '""')}"`,
          `"${t.categories?.name || 'Uncategorized'}"`,
          t.date,
          t.type,
          t.amount,
          `"${(t.description || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        Utils.showToast('Failed to export CSV: ' + err.message, 'error');
      }
    });
  }

  // Window helpers for edit / delete
  window.editTransaction = async (id) => {
    try {
      const res = await Api.get(`/transactions/${id}`);
      const tx = res.data;
      if (tx) {
        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-title').value = tx.title;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-type').value = tx.type;
        document.getElementById('tx-category').value = tx.category_id || '';
        document.getElementById('tx-date').value = tx.date;
        document.getElementById('tx-description').value = tx.description || '';

        document.getElementById('modal-title').textContent = 'Edit Transaction';
        Utils.openModal('transaction-modal');
      }
    } catch (err) {
      Utils.showToast('Could not fetch transaction details', 'error');
    }
  };

  window.deleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await Api.delete(`/transactions/${id}`);
      Utils.showToast('Transaction deleted', 'success');
      await loadTransactions();
    } catch (err) {
      Utils.showToast(err.message || 'Delete failed', 'error');
    }
  };

  window.openNewTransactionModal = () => {
    const form = document.getElementById('transaction-form');
    if (form) form.reset();
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-title').textContent = 'Add Transaction';
    Utils.openModal('transaction-modal');
  };

  await loadCategories();
  await loadTransactions();
});

