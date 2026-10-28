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

let currentMetric = 'soru'; 
let currentCalendarDate = new Date();

function switchTab(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';

    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (viewId === 'graphicsView') loadChartData();
    if (viewId === 'calendarView') loadCalendarGrid();
    if (viewId === 'reportsView') loadReportsTable();
    if (viewId === 'profileView') loadProfileData();
    if (viewId === 'createView') {
        setAllowedDates();
    }
}

// Son 30 gün ile bugün arasını izin veren, gelecek tarihleri kapatan tarih ayarı
function setAllowedDates() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const minStr = thirtyDaysAgo.toISOString().split('T')[0];

    const dateInput = document.getElementById('studyDate');
    if (dateInput) {
        dateInput.min = minStr;
        dateInput.max = todayStr;
        if (!dateInput.value) {
            dateInput.value = todayStr;
        }
    }
}

function openRegister() {
    document.getElementById('loginFormSection').style.display = 'none';
    document.getElementById('registerFormSection').style.display = 'block';
}

function openLogin() {
    document.getElementById('registerFormSection').style.display = 'none';
    document.getElementById('loginFormSection').style.display = 'block';
}

// Oturum Kontrolü ve Profil Bilgisi Yükleme
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('appSidebar').style.display = 'flex';
        
        loadUserProfile(user);
        loadChartData();
        setAllowedDates();
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
        .then(cred => {
            cred.user.updateProfile({ displayName: name });
            return db.ref('users/' + cred.user.uid + '/profile').set({ 
                isim: name, 
                eposta: email, 
                telefon: phone, 
                sinif: grade 
            });
        })
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

// Bilgi Girişi ve Sınır Kontrolleri (Son 30 gün ve gelecek tarih engeli)
document.getElementById('studyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const date = document.getElementById('studyDate').value;
    
    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);
    
    const thirtyDaysAgoObj = new Date(todayObj);
    thirtyDaysAgoObj.setDate(thirtyDaysAgoObj.getDate() - 30);

    const selectedObj = new Date(date);
    selectedObj.setHours(0,0,0,0);

    if (selectedObj < thirtyDaysAgoObj || selectedObj > todayObj) {
        alert("Sadece son 30 gün içine kayıt girebilir veya düzenleyebilirsiniz. Gelecek tarihlere kayıt yapılamaz! 🛑");
        return;
    }

    const questions = Number(document.getElementById('studyQuestions').value) || 0;
    const pages = Number(document.getElementById('studyPages').value) || 0;
    const hours = Number(document.getElementById('studyHours').value) || 0;
    const minutes = Number(document.getElementById('studyMinutes').value) || 0;
    const totalHours = hours + (minutes / 60);

    if (questions > 720) {
        alert("Günlük en fazla 720 soru girebilirsin! 🛑");
        return;
    }
    if (pages > 600) {
        alert("Günlük en fazla 600 sayfa kitap okuyabilirsin! 🛑");
        return;
    }
    if (totalHours > 16) {
        alert("Günlük çalışma süresi en fazla 16 saat olabilir! 🛑");
        return;
    }

    const entryData = {
        soru: questions,
        sayfa: pages,
        sure: totalHours,
        timestamp: Date.now()
    };

    db.ref(`users/${user.uid}/entries/${date}`).set(entryData)
        .then(() => {
            alert("Çalışma başarıyla kaydedildi! 🚀");
            document.getElementById('studyForm').reset();
            setAllowedDates();
        })
        .catch(err => alert("Kayıt hatası: " + err.message));
});

function markAsNotStudied() {
    const dateInput = document.getElementById('studyDate').value;
    if (!dateInput) {
        alert("Lütfen bir tarih seçin.");
        return;
    }

    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);
    const thirtyDaysAgoObj = new Date(todayObj);
    thirtyDaysAgoObj.setDate(thirtyDaysAgoObj.getDate() - 30);
    const selectedObj = new Date(dateInput);
    selectedObj.setHours(0,0,0,0);

    if (selectedObj < thirtyDaysAgoObj || selectedObj > todayObj) {
        alert("Geçersiz tarih seçimi! Sadece son 30 gün içinde işlem yapabilirsiniz. 🛑");
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
                let uVal = 0;
                let activeSum = 0;
                let activeCount = 0;

                Object.keys(allUsersData).forEach(uid => {
                    const entries = allUsersData[uid].entries || {};
                    let userMonthTotal = 0;
                    let hasEntryThisMonth = false;

                    Object.keys(entries).forEach(dateKey => {
                        if (dateKey.startsWith(`2026-${mStr}`)) {
                            hasEntryThisMonth = true;
                            let val = 0;
                            if (currentMetric === 'soru') val = entries[dateKey].soru || 0;
                            else if (currentMetric === 'kitap') val = entries[dateKey].sayfa || 0;
                            else if (currentMetric === 'calisma') val = entries[dateKey].sure || 0;
                            userMonthTotal += val;
                        }
                    });

                    if (hasEntryThisMonth) {
                        activeSum += userMonthTotal;
                        activeCount++;
                        if (uid === user.uid) {
                            uVal = userMonthTotal;
                        }
                    }
                });

                userValues.push(uVal);
                let avg = activeCount > 0 ? (activeSum / activeCount) : 0;
                avgValues.push(currentMetric === 'calisma' ? Number(avg.toFixed(2)) : Math.round(avg));
            });

        } else if (range === 'yearly') {
            labels = ["2026", "2027", "2028", "2029"];
            
            labels.forEach(year => {
                let uVal = 0;
                let activeSum = 0;
                let activeCount = 0;

                Object.keys(allUsersData).forEach(uid => {
                    const entries = allUsersData[uid].entries || {};
                    let userYearTotal = 0;
                    let hasEntryThisYear = false;

                    Object.keys(entries).forEach(dateKey => {
                        if (dateKey.startsWith(year)) {
                            hasEntryThisYear = true;
                            let val = 0;
                            if (currentMetric === 'soru') val = entries[dateKey].soru || 0;
                            else if (currentMetric === 'kitap') val = entries[dateKey].sayfa || 0;
                            else if (currentMetric === 'calisma') val = entries[dateKey].sure || 0;
                            userYearTotal += val;
                        }
                    });

                    if (hasEntryThisYear) {
                        activeSum += userYearTotal;
                        activeCount++;
                        if (uid === user.uid) {
                            uVal = userYearTotal;
                        }
                    }
                });

                userValues.push(uVal);
                let avg = activeCount > 0 ? (activeSum / activeCount) : 0;
                avgValues.push(currentMetric === 'calisma' ? Number(avg.toFixed(2)) : Math.round(avg));
            });

        } else {
            let count = (range === 'weekly') ? 7 : 10;
            
            for (let i = count - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                labels.push(dateStr);

                let uVal = 0;
                let activeSum = 0;
                let activeCount = 0;

                Object.keys(allUsersData).forEach(uid => {
                    const entries = allUsersData[uid].entries || {};
                    if (entries[dateStr]) {
                        const dayEntry = entries[dateStr];
                        let val = 0;
                        if (currentMetric === 'soru') val = dayEntry.soru || 0;
                        else if (currentMetric === 'kitap') val = dayEntry.sayfa || 0;
                        else if (currentMetric === 'calisma') val = Number(dayEntry.sure) || 0;

                        activeSum += val;
                        activeCount++;
                        if (uid === user.uid) {
                            uVal = val;
                        }
                    }
                });

                userValues.push(uVal);
                let avg = activeCount > 0 ? (activeSum / activeCount) : 0;
                avgValues.push(currentMetric === 'calisma' ? Number(avg.toFixed(2)) : Math.round(avg));
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
                        label: 'Genel Ortalama',
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
                div.classList.add('worked');
            }

            grid.appendChild(div);
        }

        calculateStreaks(data);
    });
}

// Tüm Çalışma Kayıtları Tablosu (Sadece en son girilen ilk 2 kayıt için düzenle butonu)
function loadReportsTable() {
    const user = auth.currentUser;
    if (!user) return;

    db.ref(`users/${user.uid}/entries`).once('value', snapshot => {
        const data = snapshot.val() || {};
        const tbody = document.getElementById('reportsTableBody');
        tbody.innerHTML = '';

        // Kayıtları tarihe göre tersten sıralıyoruz (En yeni en üstte)
        const sortedDates = Object.keys(data).sort().reverse();

        if (sortedDates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">Henüz bir çalışma kaydı bulunmuyor.</td></tr>`;
            return;
        }

        sortedDates.forEach((dateStr, index) => {
            const entry = data[dateStr];
            const totalHours = entry.sure || 0;
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);

            const parts = dateStr.split('-');
            const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;

            const tr = document.createElement('tr');
            
            let actionHtml = '';
            // Tablodaki ilk 2 satır, sisteme en son girilen en yeni 2 kayıttır.
            if (index < 2) {
                actionHtml = `<button onclick="editEntry('${dateStr}')" style="padding: 2px 6px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500;" title="Düzenle"><i class="fa-solid fa-pen"></i></button>`;
            }

            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td>${entry.soru || 0}</td>
                <td>${hours} saat ${minutes} dk</td>
                <td>${entry.sayfa || 0}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function editEntry(dateStr) {
    switchTab('createView');
    document.getElementById('studyDate').value = dateStr;
    
    const user = auth.currentUser;
    if (!user) return;

    db.ref(`users/${user.uid}/entries/${dateStr}`).once('value', snapshot => {
        const entry = snapshot.val();
        if (entry) {
            document.getElementById('studyQuestions').value = entry.soru || 0;
            document.getElementById('studyPages').value = entry.sayfa || 0;
            const totalHours = entry.sure || 0;
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);
            document.getElementById('studyHours').value = hours;
            document.getElementById('studyMinutes').value = minutes;
        }
    });
}

function calculateStreaks(entries) {
    let bestStreak = 0;
    let tempStreak = 0;
    let totalWorkedDays = 0;

    const registeredDates = Object.keys(entries).sort();
    totalWorkedDays = registeredDates.length;

    if (registeredDates.length === 0) {
        document.getElementById('currentStreakVal').innerText = 0;
        document.getElementById('bestStreakVal').innerText = 0;
        document.getElementById('totalDaysVal').innerText = 0;
        return;
    }

    for (let i = 0; i < registeredDates.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const prevDate = new Date(registeredDates[i - 1]);
            const currDate = new Date(registeredDates[i]);
            const diffTime = Math.abs(currDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }

        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
        }
    }

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWorkedDateStr = registeredDates[registeredDates.length - 1];
    const lastWorkedDate = new Date(lastWorkedDateStr);
    lastWorkedDate.setHours(0, 0, 0, 0);

    if (lastWorkedDate.getTime() === today.getTime() || lastWorkedDate.getTime() === yesterday.getTime()) {
        let checkDate = new Date(lastWorkedDate);

        while (true) {
            const mStr = String(checkDate.getMonth() + 1).padStart(2, '0');
            const dStr = String(checkDate.getDate()).padStart(2, '0');
            const dateStr = `${checkDate.getFullYear()}-${mStr}-${dStr}`;

            if (registeredDates.includes(dateStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0;
    }

    document.getElementById('currentStreakVal').innerText = currentStreak;
    document.getElementById('bestStreakVal').innerText = bestStreak;
    document.getElementById('totalDaysVal').innerText = totalWorkedDays;
} 

function loadUserProfile(user) {
    if (!user) return;

    db.ref(`users/${user.uid}/profile`).once('value', snapshot => {
        const profile = snapshot.val();
        if (profile && profile.isim) {
            document.getElementById('welcomeUserName').innerText = profile.isim;
        } else {
            document.getElementById('welcomeUserName').innerText = user.email ? user.email.split('@')[0] : "Öğrenci";
        }
    });
}

function loadProfileData() {
    const user = auth.currentUser;
    if (!user) return;

    db.ref(`users/${user.uid}/profile`).once('value', snapshot => {
        const profile = snapshot.val() || {};
        document.getElementById('profileName').value = profile.isim || '';
        document.getElementById('profileEmail').value = profile.eposta || user.email || '';
        document.getElementById('profilePhone').value = profile.telefon || '';
        document.getElementById('profileGrade').value = profile.sinif || '';
    });
}

function toggleVersionDetails() {
    const detailsBox = document.getElementById('versionDetailsBox');
    const chevronIcon = document.getElementById('versionChevronIcon');

    if (!detailsBox) return;

    const computedDisplay = window.getComputedStyle(detailsBox).display;

    if (computedDisplay === 'none') {
        detailsBox.style.display = 'block';
        chevronIcon.classList.remove('fa-chevron-down');
        chevronIcon.classList.add('fa-chevron-up');
    } else {
        detailsBox.style.display = 'none';
        chevronIcon.classList.remove('fa-chevron-up');
        chevronIcon.classList.add('fa-chevron-down');
    }
}