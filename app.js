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
let currentMetric = 'soru'; 
let currentCalendarDate = new Date(); // Dinamik takvim ayı için

function switchTab(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';

    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (viewId === 'graphicsView') loadChartData();
    if (viewId === 'calendarView') loadCalendarGrid();
}

function openRegister() {
    document.getElementById('loginFormSection').style.display = 'none';
    document.getElementById('registerFormSection').style.display = 'block';
}

function openLogin() {
    document.getElementById('registerFormSection').style.display = 'none';
    document.getElementById('loginFormSection').style.display = 'block';
}

function toggleTag(element) {
    element.classList.toggle('selected');
    const lesson = element.innerText;
    if (selectedLessons.includes(lesson)) {
        selectedLessons = selectedLessons.filter(l => l !== lesson);
    } else {
        selectedLessons.push(lesson);
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('appSidebar').style.display = 'flex';
        loadChartData();
    } else {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('appSidebar').style.display = 'none';
    }
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const grade = document.getElementById('regGrade').value;
    const password = document.getElementById('regPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => db.ref('users/' + cred.user.uid + '/profile').set({ isim: name, eposta: email, telefon: phone, sinif: grade }))
        .then(() => {
            alert("Kayıt başarılı! Giriş yapabilirsiniz.");
            openLogin();
        })
        .catch(err => alert("Kayıt Hatası: " + err.message));
});

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

function setChartMetric(metric, btn) {
    currentMetric = metric;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadChartData();
}

let myChart = null;
function loadChartData() {
    const user = auth.currentUser;
    if (!user) return;

    const range = document.getElementById('timeRangeSelect').value;

    db.ref('users').once('value', snapshot => {
        const allUsersData = snapshot.val() || {};
        let labels = [];
        let userValues = [];
        let avgValues = [];

        if (range === 'monthly') {
            labels = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            
            labels.forEach((_, monthIndex) => {
                let mStr = String(monthIndex + 1).padStart(2, '0');
                let uSum = 0;
                let otherSum = 0;
                let otherCount = 0;

                Object.keys(allUsersData).forEach(uid => {
                    const entries = allUsersData[uid].entries || {};
                    let userMonthTotal = 0;
                    Object.keys(entries).forEach(dateKey => {
                        if (dateKey.startsWith(`2026-${mStr}`)) {
                            let val = 0;
                            if (currentMetric === 'soru') val = entries[dateKey].soru || 0;
                            else if (currentMetric === 'kitap') val = entries[dateKey].sayfa || 0;
                            else if (currentMetric === 'calisma') val = entries[dateKey].sure || 0;
                            userMonthTotal += val;
                        }
                    });

                    if (uid === user.uid) uSum = userMonthTotal;
                    else {
                        otherSum += userMonthTotal;
                        otherCount++;
                    }
                });

                userValues.push(uSum);
                avgValues.push(otherCount > 0 ? Math.round(otherSum / otherCount) : uSum);
            });

        } else if (range === 'yearly') {
            labels = ["2024", "2025", "2026", "2027"];
            
            labels.forEach(year => {
                let uSum = 0;
                let otherSum = 0;
                let otherCount = 0;

                Object.keys(allUsersData).forEach(uid => {
                    const entries = allUsersData[uid].entries || {};
                    let userYearTotal = 0;
                    Object.keys(entries).forEach(dateKey => {
                        if (dateKey.startsWith(year)) {
                            let val = 0;
                            if (currentMetric === 'soru') val = entries[dateKey].soru || 0;
                            else if (currentMetric === 'kitap') val = entries[dateKey].sayfa || 0;
                            else if (currentMetric === 'calisma') val = entries[dateKey].sure || 0;
                            userYearTotal += val;
                        }
                    });

                    if (uid === user.uid) uSum = userYearTotal;
                    else {
                        otherSum += userYearTotal;
                        otherCount++;
                    }
                });

                userValues.push(uSum);
                avgValues.push(otherCount > 0 ? Math.round(otherSum / otherCount) : uSum);
            });

        } else {
            let count = (range === 'weekly') ? 7 : 10;
            
            for (let i = count - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                labels.push(dateStr);

                let uVal = 0;
                let otherSum = 0;
                let otherCount = 0;

                Object.keys(allUsersData).forEach(uid => {
                    const entries = allUsersData[uid].entries || {};
                    const dayEntry = entries[dateStr] || {};
                    let val = 0;
                    if (currentMetric === 'soru') val = dayEntry.soru || 0;
                    else if (currentMetric === 'kitap') val = dayEntry.sayfa || 0;
                    else if (currentMetric === 'calisma') val = dayEntry.sure || 0;

                    if (uid === user.uid) uVal = val;
                    else {
                        otherSum += val;
                        otherCount++;
                    }
                });

                userValues.push(uVal);
                avgValues.push(otherCount > 0 ? Math.round(otherSum / otherCount) : uVal);
            }
        }

        let labelName = 'Çözülen Soru';
        if (currentMetric === 'kitap') labelName = 'Okunan Sayfa (Kitap)';
        if (currentMetric === 'calisma') labelName = 'Çalışma Süresi (Saat)';

        const ctx = document.getElementById('studyChart').getContext('2d');
        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: labelName,
                        data: userValues,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Ortalama (Diğer Öğrenciler)',
                        data: avgValues,
                        borderColor: '#f59e0b',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    });
}

// Takvim Ay Değiştirme ve Seri Hesaplama
function changeCalendarMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    loadCalendarGrid();
}

function loadCalendarGrid() {
    const user = auth.currentUser;
    if (!user) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    document.getElementById('calendarMonthTitle').innerText = `${monthNames[month]} ${year}`;

    db.ref(`users/${user.uid}/entries`).once('value', snapshot => {
        const data = snapshot.val() || {};
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const mStr = String(month + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateStr = `${year}-${mStr}-${dStr}`;

            const div = document.createElement('div');
            div.className = 'cal-day';
            div.innerText = day;

            if (data[dateStr]) {
                if (!data[dateStr].calismadi && (data[dateStr].soru > 0 || data[dateStr].sure > 0)) {
                    div.classList.add('worked');
                } else {
                    div.classList.add('missed');
                }
            }

            grid.appendChild(div);
        }

        calculateStreaks(data);
    });
}

function calculateStreaks(entries) {
    let currentStreak = 0;
    let bestStreak = 0;
    let totalWorkedDays = 0;

    const sortedDates = Object.keys(entries).sort();

    sortedDates.forEach(dateKey => {
        const entry = entries[dateKey];
        if (!entry.calismadi && (entry.soru > 0 || entry.sure > 0)) {
            totalWorkedDays++;
            currentStreak++;
            if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
            currentStreak = 0;
        }
    });

    document.getElementById('currentStreakVal').innerText = currentStreak;
    document.getElementById('bestStreakVal').innerText = bestStreak;
    document.getElementById('totalDaysVal').innerText = totalWorkedDays;
}