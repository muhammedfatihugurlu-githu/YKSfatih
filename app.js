const firebaseConfig = {
    apiKey: "AIzaSyDWCM6kkyW1uhMVdYaYQEzfNZM6GM9tmUY",
    authDomain: "fetih-social.firebaseapp.com",
    databaseURL: "https://fetih-social-default-rtdb.firebaseio.com",
    projectId: "fetih-social",
    storageBucket: "fetih-social.firebasestorage.app",
    messagingSenderId: "318464303358",
    appId: "1:318464303358:web:bdf10137d0cd8780fa9bc2"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

let selectedLessons = [];

// Sekme Değiştirme
function switchTab(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';

    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (viewId === 'graphicsView') loadChartData();
    if (viewId === 'calendarView') loadCalendarGrid();
}

// Auth Ekranı Geçişleri
function openRegister() {
    document.getElementById('loginFormSection').style.display = 'none';
    document.getElementById('registerFormSection').style.display = 'block';
}

function openLogin() {
    document.getElementById('registerFormSection').style.display = 'none';
    document.getElementById('loginFormSection').style.display = 'block';
}

// Ders Etiket Seçimi
function toggleTag(element) {
    element.classList.toggle('selected');
    const lesson = element.innerText;
    if (selectedLessons.includes(lesson)) {
        selectedLessons = selectedLessons.filter(l => l !== lesson);
    } else {
        selectedLessons.push(lesson);
    }
}

// Oturum Kontrolü
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('appSidebar').style.display = 'flex';
        loadUserData(user.uid);
    } else {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('appSidebar').style.display = 'none';
    }
});

// Kayıt Olma
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const grade = document.getElementById('regGrade').value;
    const password = document.getElementById('regPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            return db.ref('users/' + cred.user.uid + '/profile').set({ isim: name, eposta: email, telefon: phone, sinif: grade });
        })
        .then(() => {
            alert("Kayıt başarılı! Giriş yapabilirsiniz.");
            openLogin();
        })
        .catch(err => alert("Kayıt Hatası: " + err.message));
});

// Giriş Yapma
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch(err => alert("Giriş Hatası: E-posta veya şifre hatalı!"));
});

function logoutUser() {
    auth.signOut();
}

// Çalışma Kaydetme
document.getElementById('studyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const date = document.getElementById('studyDate').value;
    const questions = Number(document.getElementById('studyQuestions').value) || 0;
    const pages = Number(document.getElementById('studyPages').value) || 0;
    const hours = Number(document.getElementById('studyHours').value) || 0;
    const minutes = Number(document.getElementById('studyMinutes').value) || 0;

    const entryData = {
        soru: questions,
        sayfa: pages,
        sure: hours + (minutes / 60),
        dersler: selectedLessons,
        timestamp: Date.now()
    };

    db.ref(`users/${user.uid}/entries/${date}`).set(entryData)
        .then(() => {
            alert("Çalışma başarıyla kaydedildi! 🚀");
            document.getElementById('studyForm').reset();
            selectedLessons = [];
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
        })
        .catch(err => alert("Kayıt hatası: " + err.message));
});

function markAsNotStudied() {
    const dateInput = document.getElementById('studyDate').value;
    if (!dateInput) {
        alert("Lütfen bir tarih seçin.");
        return;
    }
    const user = auth.currentUser;
    db.ref(`users/${user.uid}/entries/${dateInput}`).set({ soru: 0, sayfa: 0, sure: 0, calismadi: true })
        .then(() => alert("Bugün çalışılmadı olarak işaretlendi."));
}

// Grafik Yükleme (Chart.js)
let myChart = null;
function loadChartData() {
    const user = auth.currentUser;
    if (!user) return;

    db.ref(`users/${user.uid}/entries`).once('value', snapshot => {
        const data = snapshot.val() || {};
        const dates = [];
        const questions = [];

        // Son 7-10 günü alalım
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dates.push(dateStr);
            questions.push(data[dateStr] ? data[dateStr].soru || 0 : 0);
        }

        const ctx = document.getElementById('studyChart').getContext('2d');
        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Çözülen Soru',
                    data: questions,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    });
}

// Takvim Grid Doldurma
function loadCalendarGrid() {
    const user = auth.currentUser;
    if (!user) return;

    db.ref(`users/${user.uid}/entries`).once('value', snapshot => {
        const data = snapshot.val() || {};
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const daysInMonth = 31; // Ekim ayı için
        for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = `2026-10-${day < 10 ? '0' + day : day}`;
            const div = document.createElement('div');
            div.className = 'cal-day';
            div.innerText = day;

            if (data[dayStr] && !data[dayStr].calismadi && (data[dayStr].soru > 0 || data[dayStr].sure > 0)) {
                div.classList.add('worked');
            }
            grid.appendChild(div);
        }
    });
}

function loadUserData(uid) {
    db.ref(`users/${uid}/entries`).once('value', snapshot => {
        const data = snapshot.val() || {};
        let totalQ = 0;
        let totalH = 0;
        let daysCount = 0;

        Object.values(data).forEach(entry => {
            totalQ += entry.soru || 0;
            totalH += entry.sure || 0;
            if (!entry.calismadi) daysCount++;
        });

        document.getElementById('goalQuestions').innerText = `${totalQ} / 500`;
        document.getElementById('goalHours').innerText = `${totalH.toFixed(1)} sa / 20 sa`;
        document.getElementById('currentStreak').innerText = `${daysCount} gün`;
        document.getElementById('totalDays').innerText = `${daysCount} gün`;
    });
}