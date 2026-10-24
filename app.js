// Firebase Veritabanı Bağlantı Adresi
const firebaseConfig = {
    databaseURL: "https://fetih-social-default-rtdb.firebaseio.com"
};

// Firebase Başlatma
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Bugünün tarihini otomatik olarak tarih inputuna yaz
const dateInput = document.getElementById('dateInput');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// Form Gönderildiğinde Veriyi Firebase'e Kaydetme
const studyForm = document.getElementById('studyForm');
studyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const date = document.getElementById('dateInput').value;
    const question = Number(document.getElementById('questionInput').value) || 0;
    const time = Number(document.getElementById('timeInput').value) || 0;
    const page = Number(document.getElementById('pageInput').value) || 0;

    // Tarihi anahtar yaparak Firebase'e kaydet (Örn: calismalar/20261024)
    const dateKey = date.replace(/-/g, '');
    
    db.ref('calismalar/' + dateKey).set({
        tarih: date,
        soru: question,
        sure: time,
        sayfa: page
    }, (error) => {
        if (error) {
            alert("Kayıt sırasında bir hata oluştu!");
        } else {
            alert("Çalışman başarıyla Firebase'e kaydedildi! 🚀");
            studyForm.reset();
            dateInput.value = today;
            verileriCek();
        }
    });
});

// Firebase'den Bugünkü Verileri Çekip Ekranda Gösterme
function verileriCek() {
    const todayKey = today.replace(/-/g, '');
    db.ref('calismalar/' + todayKey).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('questionCount').innerText = `${data.soru} / 500`;
            document.getElementById('studyTime').innerText = `${data.sure} / 200 dk`;
            document.getElementById('pageCount').innerText = `${data.sayfa} / 150`;
        } else {
            document.getElementById('questionCount').innerText = `0 / 500`;
            document.getElementById('studyTime').innerText = `0 / 200 dk`;
            document.getElementById('pageCount').innerText = `0 / 150`;
        }
    });
}

// Sayfa açıldığında verileri yükle
verileriCek();