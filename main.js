// =======================
// تخزين واسترجاع البيانات
// =======================
let books = JSON.parse(localStorage.getItem("books")) || [];

// =======================
// عرض الكتب في الصفحة الرئيسية
// =======================
// 
function renderBooks() {
  const booksSection = document.getElementById("books");
  if (!booksSection) return;
  booksSection.innerHTML = '';
  books.forEach((book, index) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <h5>${book.title}</h5>
      <p> ${book.field}</p>
      <p>السعر: ${book.price} ج</p>
      <p  onclick="removeBook(${index})">${book.sold ? '<span style="color:red">تم الشراء</span>' : ''}</p>
      ${!book.sold ? `<button class="but-one" onclick="addToCart(${index})">أضف للسلة</button>` : ''}
      <button class="but-two" onclick="showPreview(books[${index}])">معاينة</button>
    `;
    booksSection.appendChild(card);
  });
}
// =======================
// عرض معاينه الكتاب
// =======================
function showPreview(book) {
  const filePath = book.preview ? 'uploads/' + book.preview : 'https://example.com/sample.pdf';

  Swal.fire({
    title: book.title,
    html: `
      <div style="position:relative;">
        <iframe src="${filePath}" width="100%" height="400px" style="pointer-events:none;"></iframe>
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
                    background:rgba(255,255,255,0.1);
                    display:flex;justify-content:center;align-items:center;
                    pointer-events:none;">
          <span style="font-size:30px;color:#00000055;font-weight:bold;
                       transform: rotate(-30deg);">Maktabtak.com</span>
        </div>
      </div>
    `,
    confirmButtonText: 'إغلاق'
  });
}

// =======================
// اضافه الكتب الي السله
// =======================
function addToCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push(books[index]);
  localStorage.setItem("cart", JSON.stringify(cart));
  Swal.fire({
    icon: 'success',
    title: 'تمت الإضافة!',
    text: `تمت إضافة ${books[index].title} إلى السلة.`
  });
}
// حذف كتاب من قائمه الكتب
function removeBook(index) {
  books.splice(index, 1);
  localStorage.setItem("books", JSON.stringify(books));
  renderBooks();
}

// عرض الكتب تلقائياً في الصفحه الرئيسيه
if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {
  renderBooks();
}

// =======================
// اضافه كتاب جديد من صفحه اضافه منتج
// =======================
if (window.location.pathname.includes("add-product.html")) {
  const form = document.getElementById("product-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      
      const fileInput = document.getElementById("fileInput");
      const fileName = fileInput.files[0] ? fileInput.files[0].name : '';

      const newBook = {
        title: document.getElementById("title").value,
        field: document.getElementById("field").value,
        price: parseFloat(document.getElementById("price").value),
        seller: document.getElementById("account").value,
        preview: fileName, // يتم افتراض وجود الملف داخل مجلد uploads/
        sold: false
      };

      books.push(newBook);
      localStorage.setItem("books", JSON.stringify(books));

      Swal.fire('تم الإضافة!', 'تم تسجيل المنتج بنجاح.', 'success')
        .then(() => location.href = "index.html");
    });
  }
}

// =======================
// عرض كروت الكتب في السله
// =======================
if (window.location.pathname.includes("cart.html")) {
  const cartList = document.getElementById("cart-list");
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function renderCart() {
    if (!cartList) return;
    cartList.innerHTML = '';
    cart.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "book-card";
      div.innerHTML = `
        <h5>${item.title}</h5>
        <p>${item.price} ج</p>
        <button onclick="removeFromCart(${i})">حذف من السلة</button>
      `;
      cartList.appendChild(div);
    });
  }

  // حذف الكتاب من السله وتنفيذ الدفع وفتح المنتج بعد الدفع

  window.removeFromCart = function(i) {
    cart.splice(i, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  };


  renderCart();

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      const total = cart.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

      Swal.fire({
        title: 'إتمام الدفع',
        html: `<p>المبلغ المطلوب: ${total} ج</p>
               <input type='text' id='payer' class='swal2-input' placeholder='رقم محفظتك'>`,
        confirmButtonText: 'دفع',
        preConfirm: () => {
          const payer = document.getElementById("payer").value;
          if (!payer) {
            Swal.showValidationMessage("من فضلك أدخل رقم المحفظة.");
            return false;
          }

          // وسم المنتجات كمشتراة
          cart.forEach(book => {
            const idx = books.findIndex(b =>
              b.title === book.title &&
              b.field === book.field &&
              b.price === book.price &&
              b.preview === book.preview
            );
            if (idx !== -1) books[idx].sold = true;
          });

          // حفظ حالة الكتب
          localStorage.setItem("books", JSON.stringify(books));

          // ********* تنزيل الملفات بعد الدفع *********
          cart.forEach(book => {
            if (book.preview) {
              const href = 'uploads/' + book.preview;
              const a = document.createElement('a');
              a.href = href;
              a.download = book.preview; // اسم الملف
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          });

          localStorage.removeItem("cart");
          cart = [];

          return true;
        }
      }).then((res) => {
        if (res.isConfirmed) {
          Swal.fire('تم الدفع!', 'تم تحويل المبلغ بنجاح وتنزيل ملفاتك.', 'success')
            .then(() => location.href = "index.html");
        }
      });
    };
  }
}

// =======================
// صفحة البحث عن الكتب
// =======================
if (window.location.pathname.includes("search.html")) {
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.onclick = () => {
      const query = (document.getElementById("searchInput").value || "").toLowerCase().trim();
      const results = books.filter(book => book.title.toLowerCase().includes(query));
      const resultArea = document.getElementById("search-results");
      if (!resultArea) return;
      resultArea.innerHTML = '';

      results.forEach((book) => {
        //  نجيب الفهرس الحقيقي للكتاب داخل مصفوفة الكتب وعرضها بعد الدفع
        const originalIndex = books.findIndex(b =>
          b.title === book.title &&
          b.field === book.field &&
          b.price === book.price &&
          b.preview === book.preview
        );

        const div = document.createElement("div");
        div.className = "book-card";
        div.innerHTML = `
          <h5>${book.title}</h5>
          <p>${book.field} - ${book.price} ج</p>
          ${!book.sold ? `<button onclick="addToCart(${originalIndex})">أضف للسلة</button>` : '<span style="color:red">تم الشراء</span>'}
          <button onclick="showPreview(books[${originalIndex}])">معاينة</button>
        `;
        resultArea.appendChild(div);
      });
    };
  }
}












