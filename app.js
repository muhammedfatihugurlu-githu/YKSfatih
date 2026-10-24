// Firebase Yapılandırması
const firebaseConfig = {
    databaseURL: "https://fetih-social-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Form ve Bölüm Seçicileri
const loginFormSection = document.getElementById('loginFormSection');
const registerFormSection = document.getElementById('registerFormSection');
const toRegisterBtn = document.getElementById('toRegister');
const toLoginBtn = document.getElementById('toLogin');

// Sekme Değiştirme (Giriş <-> Kayıt)
toRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormSection.style.display = 'none';
    registerFormSection.style.display = 'block';
});

toLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerFormSection.style.display = 'none';
    loginFormSection.style.display = 'block';
});

// KAYIT OLMA İŞLEMİ
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const grade = document.getElementById('regGrade').value;
    const password = document.getElementById('regPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Ek bilgileri Realtime Database içerisine kaydedelim
            db.ref('users/' + user.uid).set({
                isim: name,
                eposta: email,
                telefon: phone,
                sinif: grade
            }, (error) => {
                if (error) {
                    alert("Kayıt veritabanına kaydedilemedi!");
                } else {
                    alert("Kayıt başarıyla oluşturuldu! Giriş yapabilirsiniz.");
                    registerForm.reset();
                    registerFormSection.style.display = 'none';
                    loginFormSection.style.display = 'block';
                }
            });
        })
        .catch((error) => {
            alert("Kayıt Hatası: " + error.message);
        });
});

// GİRİŞ YAPMA İŞLEMİ
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Başarıyla giriş yapıldı! YKS takip paneline yönlendiriliyorsunuz... 🚀");
            // Giriş başarılı olunca ana takip paneline yönlendirme yapabilirsin
            // Örn: window.location.href = "dashboard.html";
        })
        .catch((error) => {
            alert("Giriş Başarısız: E-posta veya şifre hatalı!");
        });
});