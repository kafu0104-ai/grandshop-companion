// GRAND SHOP 2026 購入確認ページ const APP_KEY =
‘grandshop-2026-purchaser-app-v1’;

const defaultApp = { purchasers: [{ id: ‘me’, name: ‘わたし’ }],
activePurchaserId: ‘me’, quantities: { me: {} }, bonusByPurchaser: { me:
{ yukata: 0, shining: 0, raging: 0 } }, purchasedByPurchaser: { me: {}
}, soldOut: {} };

let app;

try { app = JSON.parse(localStorage.getItem(APP_KEY) || ‘null’); } catch
(error) { console.error(‘保存データの読み込みに失敗しました。’, error);
}

if (!app || !Array.isArray(app.purchasers)) { app = typeof
structuredClone === ‘function’ ? structuredClone(defaultApp) :
JSON.parse(JSON.stringify(defaultApp)); }

app.quantities ||= {}; app.purchasedByPurchaser ||= {}; app.soldOut ||=
{}; app.activePurchaserId ||= ‘me’;

app.purchasers.forEach((purchaser) => { app.quantities[purchaser.id] ||=
{}; app.purchasedByPurchaser[purchaser.id] ||= {}; });

const isAll = () => app.activePurchaserId === ‘all’;

const activeBuyer = () => app.purchasers.find((purchaser) =>
purchaser.id === app.activePurchaserId);

function saveApp() { try { localStorage.setItem(APP_KEY,
JSON.stringify(app)); } catch (error) {
console.error(‘保存に失敗しました。’, error); } }

function getQty(productId, purchaserId = app.activePurchaserId) { if
(purchaserId === ‘all’) { return app.purchasers.reduce((sum, purchaser)
=> { return sum + Number(app.quantities[purchaser.id]?.[productId] ||
0); }, 0); }

return Number(app.quantities[purchaserId]?.[productId] || 0); }

function getPurchased(productId, purchaserId = app.activePurchaserId) {
if (purchaserId === ‘all’) { const purchasersWithQuantity =
app.purchasers.filter( (purchaser) => getQty(productId, purchaser.id) >
0 );

    return (
      purchasersWithQuantity.length > 0 &&
      purchasersWithQuantity.every(
        (purchaser) =>
          Boolean(app.purchasedByPurchaser[purchaser.id]?.[productId])
      )
    );

}

return Boolean(app.purchasedByPurchaser[purchaserId]?.[productId]); }

function getSoldOut(productId) { return Boolean(app.soldOut[productId]);
}

function markPurchased(productId) { if (isAll()) {
app.purchasers.forEach((purchaser) => { if (getQty(productId,
purchaser.id) > 0) { app.purchasedByPurchaser[purchaser.id] ||= {};
app.purchasedByPurchaser[purchaser.id][productId] = true; } }); return;
}

app.purchasedByPurchaser[app.activePurchaserId] ||= {};
app.purchasedByPurchaser[app.activePurchaserId][productId] = true; }

function escapeHtml(value) { return String(value ?? ’‘)
.replaceAll(’&‘,’&‘) .replaceAll(’<‘,’<‘) .replaceAll(’>‘,’>‘)
.replaceAll(’“‘,’”‘) .replaceAll(“’“, ’'’); }

function getCharacterLabel(product) { return ( product.character ||
product.princeCat || product.mascot || product.variant || ’’ ); }

function compareProducts(a, b) { return ( Number(a.displayOrder || 0) -
Number(b.displayOrder || 0) || Number(a.variantNo || 0) -
Number(b.variantNo || 0) || String(a.id).localeCompare(String(b.id),
‘ja’) ); }

const selectedProducts = products .filter((product) =>
getQty(product.id) > 0 && !getSoldOut(product.id))
.sort(compareProducts);

const checkedProductIds = new Set( selectedProducts .filter((product) =>
getPurchased(product.id)) .map((product) => product.id) );

const confirmList = document.getElementById(‘confirmList’); const
emptyState = document.getElementById(‘emptyState’); const completeButton
= document.getElementById(‘completeButton’); const confirmProgress =
document.getElementById(‘confirmProgress’); const buyerName =
document.getElementById(‘buyerName’);

function updateProgress() { const total = selectedProducts.length; const
confirmed = checkedProductIds.size;

confirmProgress.textContent = ${total}商品中 ${confirmed}商品確認済み;
confirmProgress.classList.toggle(‘complete’, total > 0 && confirmed ===
total); completeButton.disabled = total === 0 || confirmed === 0; }

function renderBuyerName() { buyerName.textContent = isAll() ? ‘全体’ :
${activeBuyer()?.name || '購入者'}さん; }

function renderProducts() { if (!selectedProducts.length) {
confirmList.innerHTML = ’’; confirmList.hidden = true; emptyState.hidden
= false; updateProgress(); return; }

confirmList.hidden = false; emptyState.hidden = true;

confirmList.innerHTML = selectedProducts .map((product) => { const
quantity = getQty(product.id); const characterLabel =
getCharacterLabel(product); const checked =
checkedProductIds.has(product.id);

      return `
        <article class="confirm-item ${checked ? 'confirmed' : ''}" data-product-id="${escapeHtml(product.id)}">
          <div class="confirm-thumb">
            <img
              loading="lazy"
              src="${escapeHtml(product.image)}"
              alt=""
            >
          </div>

          <div class="confirm-info">
            <h2>${escapeHtml(product.name)}</h2>
            ${characterLabel
              ? `<p class="confirm-character">${escapeHtml(characterLabel)}</p>`
              : ''}
            <p class="confirm-quantity">数量 <strong>${quantity}</strong></p>
          </div>

          <label class="confirm-check">
            <input
              type="checkbox"
              data-confirm-id="${escapeHtml(product.id)}"
              ${checked ? 'checked' : ''}
            >
            <span>購入確認</span>
          </label>
        </article>
      `;
    })
    .join('');

confirmList .querySelectorAll(‘input[data-confirm-id]’)
.forEach((checkbox) => { checkbox.addEventListener(‘change’, () => {
const productId = checkbox.dataset.confirmId; const card =
checkbox.closest(‘.confirm-item’);

        if (checkbox.checked) {
          checkedProductIds.add(productId);
        } else {
          checkedProductIds.delete(productId);
        }

        card?.classList.toggle('confirmed', checkbox.checked);
        updateProgress();
      });
    });

updateProgress(); }

completeButton.addEventListener(‘click’, () => { if
(!checkedProductIds.size) return;

checkedProductIds.forEach(markPurchased); saveApp();

const total = selectedProducts.length; const confirmed =
checkedProductIds.size; const message = confirmed === total ?
${confirmed}商品を購入済みにしました。 :
${confirmed}商品を購入済みにしました。\n未確認の商品はそのまま残ります。;

alert(message); location.href = ‘./index.html’; });

renderBuyerName(); renderProducts();
