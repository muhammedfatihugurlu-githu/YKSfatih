// Firebase Yapılandırması
const firebaseConfig = {
    databaseURL: "https://fetih-social-default-rtdb.firebaseio.com"
};

// Firebase Başlatma
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

// DOM Elemanları
document.addEventListener("DOMContentLoaded", () => {
    const loginFormSection = document.getElementById('loginFormSection');
    const registerFormSection = document.getElementById('registerFormSection');
    const toRegisterBtn = document.getElementById('toRegister');
    const toLoginBtn = document.getElementById('toLogin');

    // Kayıt Ol Ekranına Geçiş
    if (toRegisterBtn) {
        toRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormSection.style.display = 'none';
            registerFormSection.style.display = 'block';
        });
    }

    // Giriş Yap Ekranına Geçiş
    if (toLoginBtn) {
        toLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerFormSection.style.display = 'none';
            loginFormSection.style.display = 'block';
        });
    }

    // KAYIT OLMA İŞLEMİ (Ad Soyad, E-posta, Telefon, Sınıf, Şifre)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
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

                    // Kullanıcının detaylı bilgilerini Realtime Database üzerine kaydediyoruz
                    return db.ref('users/' + user.uid).set({
                        isim: name,
                        eposta: email,
                        telefon: phone,
                        sinif: grade,
                        kayitTarihi: new Date().toISOString()
                    });
                })
                .then(() => {
                    alert("Kayıt başarıyla tamamlandı! Artık giriş yapabilirsiniz.");
                    registerForm.reset();
                    registerFormSection.style.display = 'none';
                    loginFormSection.style.display = 'block';
                })
                .catch((error) => {
                    alert("Kayıt Hatası: " + error.message);
                });
        });
    }

    // GİRİŞ YAPMA İŞLEMİ (E-posta ve Şifre)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    alert("Başarıyla giriş yapıldı! YKS Takip Paneline Hoş Geldiniz.");
                })
                .catch((error) => {
                    alert("Giriş Hatası: E-posta veya şifre hatalı!");
                });
        });
    }
});