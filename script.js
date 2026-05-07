lucide.createIcons();
let store = { work: [], edu: [], org: [], cert: [] };
let isDemoActive = false;
let photo = null;
let cropper = null;
let docs = [
{ id: 1, label: "Surat Lamaran Kerja", files: [], checked: true, isSystemGenerated: true },
    { id: 2, label: "CV / Daftar Riwayat Hidup", files: [], checked: true, isSystemGenerated: true },
    { id: 3, label: "KTP", files: [], checked: true },
    { id: 4, label: "NPWP", files: [], checked: true },
    { id: 5, label: "Surat Keterangan Dokter", files: [], checked: true },
    { id: 6, label: "Ijazah", files: [], checked: true },
    { id: 7, label: "Transkrip Nilai", files: [], checked: true },
    { id: 8, label: "SKCK", files: [], checked: true },
    { id: 9, label: "Akta Kelahiran", files: [], checked: true },
    { id: 10, label: "Kartu Keluarga", files: [], checked: true },
    { id: 11, label: "Kartu Tanda Pencari Kerja / AK1", files: [], checked: true },
    { id: 12, label: "Paklaring", files: [], checked: true },
    { id: 13, label: "Sertifikat Vaksin Covid-19", files: [], checked: true },
    { id: 14, label: "SIM C", files: [], checked: true }
];

let signatureData = null; // Variabel global baru

// Fungsi untuk menghapus background putih secara otomatis
async function removeWhiteBackground(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Threshold: Semakin tinggi, semakin banyak warna 'mirip putih' yang dihapus
                const threshold = 120; 

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    
                    // Jika warna mendekati putih, buat jadi transparan (Alpha = 0)
                    if (r > threshold && g > threshold && b > threshold) {
                        data[i + 3] = 0; 
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
        };
        reader.readAsDataURL(file);
    });
}

async function handleSignature(input) {
    if (input.files && input.files[0]) {
        signatureData = await removeWhiteBackground(input.files[0]);
        document.getElementById('sig-status').classList.remove('hidden');
        sync();
        lucide.createIcons();
    }
}

function removeSignature() {
    signatureData = null;
    document.getElementById('sig-input').value = "";
    document.getElementById('sig-status').classList.add('hidden');
    sync();
}

function updateLayout(val) {
    // 1. Simpan value ke hidden input
    document.getElementById('cv-layout').value = val;

    // 2. Update visual tombol navigasi layout
    document.querySelectorAll('.layout-btn').forEach(b => {
        b.classList.remove('active', 'border-indigo-600', 'bg-indigo-50');
    });
    const activeBtn = document.getElementById(`btn-${val}`);
    if (activeBtn) activeBtn.classList.add('active', 'border-indigo-600', 'bg-indigo-50');

    // 3. Kontrol Visibilitas Gaya Visual
    const visualContainer = document.getElementById('visual-style-container');
    const execAlert = document.getElementById('executive-alert');

    if (val === 'executive') {
        // Sembunyikan pilihan gaya visual & tampilkan alert
        if (visualContainer) visualContainer.classList.add('hidden');
        if (execAlert) execAlert.classList.remove('hidden');
    } else {
        // Tampilkan pilihan gaya visual & sembunyikan alert
        if (visualContainer) visualContainer.classList.remove('hidden');
        if (execAlert) execAlert.classList.add('hidden');
    }
    
    // 4. Sinkronisasi Preview
    lucide.createIcons();
    sync();
}
function toggleZen(targetId) {
    // 1. Ambil semua bagian yang punya class 'zen-section'
    const sections = document.querySelectorAll('.zen-section');
    
    sections.forEach(section => {
        const content = section.querySelector('.zen-content');
        const icon = section.querySelector('.chevron-icon');
        
        if (section.id === targetId) {
            // Cek apakah sedang tertutup atau terbuka
            const isCollapsed = section.classList.contains('collapsed');
            
            if (isCollapsed) {
                // BUKA: Hilangkan class sembunyi, tambah class tampil
                section.classList.remove('collapsed', 'opacity-60');
                section.classList.add('active');
                if (content) content.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                // TUTUP: Tambah class sembunyi
                section.classList.add('collapsed', 'opacity-60');
                section.classList.remove('active');
                if (content) content.classList.add('hidden');
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        } else {
            // TUTUP OTOMATIS bagian lain agar tidak ramai
            section.classList.add('collapsed', 'opacity-60');
            section.classList.remove('active');
            if (content) content.classList.add('hidden');
            const otherIcon = section.querySelector('.chevron-icon');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
        }
    });

    // Refresh icon Lucide agar tetap muncul
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
function formatAlamatOtomatis(text) {
    if (!text) return "";

    // 1. Perbaiki spasi setelah tanda baca (koma, titik, garis miring)
    // Contoh: "taman,pemalang" -> "taman, pemalang"
    let formatted = text.replace(/([,.])(?=[^\s])/g, '$1 ');

    // 2. Proses per kata untuk membesarkan huruf depan
    return formatted.split(/\s+/).map(word => {
        let cleanWord = word.toUpperCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        
        // Pengecualian: Jika kata adalah RT atau RW, biarkan Kapital penuh
        if (cleanWord.startsWith("RT") || cleanWord.startsWith("RW")) {
            return word.toUpperCase();
        }

        // Standar: Besarkan huruf pertama, sisanya kecil
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

function titleCase(str) {
    if (!str || typeof str !== 'string') return "";
    str = str.replace(/\s*-\s*/g, " - ");
    // Daftar kata yang harus tetap Kapital Penuh (Upper Case)
    const upperExceptions = [
        "SD", "SDN", "SMP", "SMPN", "SMA", "SMAN", "SMK", "SMKN", "MAN", "MTS", "MA",
        "PGRI", "PT", "CV", "Tbk", "SKCK", "KTP", "NPWP", "SIM", "KK"
    ];
    
    // Daftar kata sambung yang harus tetap Kecil (Lower Case)
    const lowercaseExceptions = ["dan", "di", "atau", "ke", "dari", "pada", "dalam", "dengan"];
    
    return str.split(' ').map((word, index) => {
       if (word.length === 0) return "";

        const cleanWord = word.toUpperCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

        if (upperExceptions.includes(cleanWord)) {
            return word.toUpperCase();
        }

        if (word.length > 1 && word === word.toUpperCase()) {
            return word;
        }

        const lowerCleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

        if (index > 0 && lowercaseExceptions.includes(lowerCleanWord)) {
            return word.toLowerCase();
        }

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}


function compressImage(src, quality, dpiScale) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tentukan dimensi baru berdasarkan skala DPI
            // Misal: foto asli 1000px, jika DPI 50%, jadi 500px.
            const width = img.width * dpiScale;
            const height = img.height * dpiScale;

            canvas.width = width;
            canvas.height = height;

            // Gambar ulang dengan ukuran yang lebih kecil
            ctx.fillStyle = "#fff"; 
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output ke JPEG dengan kualitas yang dipilih
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}

function saveToLocal() {
    const dataToSave = {
        store: store,
        inputs: {
            name: document.getElementById('in-name').value,
            pob: document.getElementById('in-pob').value,
            dob: document.getElementById('in-dob').value,
            tb: document.getElementById('in-tb').value,
            bb: document.getElementById('in-bb').value,
            status: document.getElementById('in-status').value,
            wa: document.getElementById('in-wa').value,
            email: document.getElementById('in-email').value,
            address: document.getElementById('in-address').value,
            about: document.getElementById('in-about').value,
            city: document.getElementById('cl-city').value,
            skills: document.getElementById('in-skills').value,
            langs: document.getElementById('in-langs').value,
            letterBody: document.getElementById('cl-body').value
        },
        toggles: {
            cv: document.getElementById('cv-toggle').checked,
            photo: document.getElementById('photo-toggle').checked,
            cl: document.getElementById('cl-toggle').checked,
            clDate: document.getElementById('cl-date-toggle').checked,
            docs: document.getElementById('docs-toggle').checked
        },
        layout: document.getElementById('cv-layout').value,
        template: document.getElementById('cv-template').value,
        docsList: docs // Menyimpan daftar kategori berkas (tanpa file fisik Blob/URL)
    };
    
    localStorage.setItem('sifura_cv_draft', JSON.stringify(dataToSave));
    console.log("Draft otomatis disimpan...");
}

function loadFromLocal() {
    const savedData = localStorage.getItem('sifura_cv_draft');
    if (!savedData) return;

    try {
        const d = JSON.parse(savedData);
        
        // 1. Pulihkan Store (Pendidikan, Kerja, dll)
        store = d.store || { work: [], edu: [], org: [], cert: [] };

        // 2. Pulihkan Input Teks
        if (d.inputs) {
            Object.entries(d.inputs).forEach(([id, value]) => {
                const el = document.getElementById(`in-${id}`) || 
                           document.getElementById(`cl-${id}`) || 
                           document.getElementById(`in-name`);
                if (el) el.value = value || "";
            });
        }

        // 3. Pulihkan Foto Profil (Base64)
        if (d.photoData) {
            photo = d.photoData; // Variabel global photo diisi kembali
            document.getElementById('photo-status').classList.remove('hidden');
            document.getElementById('photo-dropzone').classList.add('hidden');
            document.getElementById('photo-filename').innerText = "foto-profil-pulih.jpg";
        }

        // 4. Pulihkan Toggles
        if (d.toggles) {
            document.getElementById('cv-toggle').checked = d.toggles.cv;
            document.getElementById('photo-toggle').checked = d.toggles.photo;
            document.getElementById('cl-toggle').checked = d.toggles.cl;
            document.getElementById('cl-date-toggle').checked = d.toggles.clDate;
            document.getElementById('docs-toggle').checked = d.toggles.docs;
        }

        // 5. Pulihkan Daftar Berkas Lampiran
        if (d.docsList) {
            docs = d.docsList;
        }

        // 6. Pulihkan Layout & Template
        if (d.layout) document.getElementById('cv-layout').value = d.layout;
        if (d.template) document.getElementById('cv-template').value = d.template;

        // 7. Refresh UI
        renderLists('edu'); renderLists('work'); renderLists('org'); renderLists('cert');
        renderChecklist();
        sync();
        
    } catch (e) {
        console.error("Gagal memuat draft:", e);
    }
}
// Update fungsi tab untuk mendukung 'template'
function tab(n, b, index) {
    // 1. Update Class Active pada tombol
    document.querySelectorAll('.nav-btn-pro').forEach(x => x.classList.remove('active'));
    if (b) b.classList.add('active');

    // 2. Gerakkan Sliding Indicator
    const indicator = document.getElementById('nav-indicator');
    if (indicator) {
        // Karena ada 4 tab, tiap tab geser 100% dari lebarnya sendiri
        indicator.style.transform = `translateX(${index * 100}%)`;
    }

    // 3. Logika Sembunyikan/Tampilkan Tab (Tetap sama)
    const allTabs = ['data', 'template', 'surat', 'berkas'];
    allTabs.forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.classList.add('hidden');
    });

    const targetTab = document.getElementById('tab-' + n);
    if (targetTab) targetTab.classList.remove('hidden');

    if (n === 'berkas') renderChecklist();
    
    lucide.createIcons(); 
}

// Fungsi baru untuk sinkronisasi antar dropdown template
function updateTemplateSelection(el) {
    // Set value ke hidden master input agar fungsi sync() tetap bekerja tanpa merubah kodenya
    document.getElementById('cv-template').value = el.value;
    
    // Reset visual dropdown satunya agar tidak membingungkan
    if (el.id === 'cv-template-ats') {
        document.getElementById('cv-template-creative').selectedIndex = -1;
    } else {
        document.getElementById('cv-template-ats').selectedIndex = -1;
    }
    
    sync(); // Jalankan render preview
}
function clearAllFiles() {
    if (confirm("Apakah Anda yakin ingin menghapus SEMUA berkas yang telah diunggah? Tindakan ini tidak dapat dibatalkan.")) {
        docs.forEach(doc => {
            if (doc.files && doc.files.length > 0) {
                doc.files.forEach(file => URL.revokeObjectURL(file.data));
                doc.files = [];
            }
        });
        unmatchedFiles = [];
        renderChecklist();
        renderUnmatched();
        sync();
        console.log("Semua berkas telah berhasil dihapus.");
    }
}


function toggleMobileView(m, btn) {
    document.querySelectorAll('.mobile-nav button').forEach(b => b.classList.remove('active-mobile'));
    btn.classList.add('active-mobile');
    const e = document.getElementById('editor-controls'), p = document.getElementById('preview-panel');
    if (m === 'edit') { e.style.display = 'flex'; p.style.display = 'none'; }
    else { e.style.display = 'none'; p.style.display = 'flex'; sync(); }
    lucide.createIcons();
}

function add(type) { 
    const newId = Date.now();
    
    // 1. Tambahkan data baru di urutan paling atas
    store[type].unshift({ id: newId, t: '', sub: '', s: '', extra: '', d: '' }); 
    
    // 2. Render ulang daftar agar elemen HTML muncul
    renderLists(type); 
    
    // 3. Gunakan setTimeout agar DOM selesai dirender, 
    //    lalu buka kartu baru & otomatis tutup kartu lama melalui expandOnlyOne
    setTimeout(() => {
        expandOnlyOne(newId);
        
        // Fokuskan ke input pertama di kartu baru agar user bisa langsung mengetik
        const firstInput = document.querySelector(`#card-${newId} input`);
        if (firstInput) firstInput.focus();
    }, 50);
}
function update(type, id, k, v) { const item = store[type].find(x => x.id === id); if (item) { item[k] = v; sync(); } }
function del(type, id) { store[type] = store[type].filter(x => x.id !== id); renderLists(type); sync(); }
function formatTanggalIndo(dateStr) { 
    if (!dateStr) return ""; 
    const d = new Date(dateStr); 
    const day = String(d.getDate()).padStart(2, '0'); // Memaksa 2 digit
    const month = d.toLocaleDateString('id-ID', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`; 
}

// Perbarui fungsi handlePhoto di script.js
function handlePhoto(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            alert("Mohon pilih file gambar (JPG/PNG).");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const modal = document.getElementById('crop-modal');
            const image = document.getElementById('crop-image');
            
            image.src = e.target.result;
            modal.classList.remove('hidden');
            modal.classList.add('flex'); // Pastikan modal muncul sebagai flex container

            // Inisialisasi Cropper dengan opsi Profesional
            if (cropper) cropper.destroy();
            
            // Memberikan sedikit delay agar modal muncul dulu sebelum cropper menghitung dimensi
            setTimeout(() => {
                cropper = new Cropper(image, {
                    aspectRatio: 3 / 4, // Rasio foto formal
                    viewMode: 1,       // Membatasi canvas agar tidak keluar dari gambar
                    dragMode: 'move',  // User bisa menggeser gambar di dalam box
                    autoCropArea: 0.8, // Ukuran awal box potong 80%
                    restore: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                });
            }, 100);
        };
        reader.readAsDataURL(file);
    }
}

// Perbarui fungsi executeCrop untuk hasil lebih tajam
async function executeCrop() {
    if (!cropper) return;

    // Ambil hasil potong dengan resolusi tinggi (600x800 px)
    const canvas = cropper.getCroppedCanvas({
        width: 450,
        height: 600,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    // Konversi ke JPEG dengan kualitas 80%
    photo = canvas.toDataURL('image/jpeg', 0.8);

    // Update UI
    const fileInput = document.getElementById('photo-input');
    const fileName = fileInput.files[0] ? fileInput.files[0].name : "foto-profil.jpg";
    
    document.getElementById('photo-filename').innerText = fileName;
    document.getElementById('photo-status').classList.remove('hidden');
    document.getElementById('photo-dropzone').classList.add('hidden');

    sync();
    closeCropModal();
    
    // Feedback sukses (Opsional)
    console.log("Foto profil berhasil diproses.");
}

function closeCropModal() {
    const modal = document.getElementById('crop-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('photo-input').value = ""; 
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Fungsi baru untuk hapus foto
function removePhoto() {
    if (confirm("Hapus foto profil ini?")) {
        photo = null; // Reset data base64
        document.getElementById('photo-input').value = ""; // Reset input file
        
        // Kembalikan UI ke semula
        document.getElementById('photo-status').classList.add('hidden');
        document.getElementById('photo-dropzone').classList.remove('hidden');
        
        sync();
        lucide.createIcons();
    }
}

// Update fungsi toggleDemoData agar sinkron dengan UI baru
// Tambahkan ini di dalam bagian 'else' (reset) fungsi toggleDemoData
function resetPhotoUI() {
    photo = null;
    document.getElementById('photo-status').classList.add('hidden');
    document.getElementById('photo-dropzone').classList.remove('hidden');
}

let unmatchedFiles = [];

function handleSmartUpload(input) {
    if (!input.files || input.files.length === 0) return;

    const uploadedFiles = Array.from(input.files);
    let matchCount = 0;
    unmatchedFiles = [];

    uploadedFiles.forEach(file => {
        const fileName = file.name.toLowerCase();
        let matched = false;

        docs.forEach(doc => {
           // Di dalam docs.forEach pada fungsi handleSmartUpload
const labelLower = doc.label.toLowerCase();

// 1. Tambahkan kata umum lainnya ke dalam daftar stopWords agar diabaikan
const stopWords = ["surat", "keterangan", "kartu", "tanda", "dokumen", "berkas", "sertifikat"]; // Tambahkan 'sertifikat' di sini

const keywords = labelLower
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
    .split(/\s+/)
    .filter(k => k.length > 2 && !stopWords.includes(k));

// 2. Gunakan logika: jika ada salah satu kata "Unik" yang cocok, maka masukkan
const isMatch = keywords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(fileName);
});

            if (isMatch && file.type.startsWith('image/')) {
                doc.files.push({
                    name: file.name,
                    data: URL.createObjectURL(file),
                    type: file.type
                });
                matched = true;
                matchCount++;
            }
        });

        if (!matched) {
            unmatchedFiles.push({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB'
            });
        }
    });

    renderChecklist();
    renderUnmatched();
    sync();
    input.value = '';
}

function renderUnmatched() {
    const container = document.getElementById('unmatched-container');
    const list = document.getElementById('unmatched-list');

    if (unmatchedFiles.length > 0) {
        container.classList.remove('hidden');
        list.innerHTML = unmatchedFiles.map((f, i) => `
            <div class="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-rose-100 shadow-sm">
                <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-rose-700 truncate max-w-[200px]">${f.name}</span>
                    <span class="text-[8px] text-rose-400 uppercase font-black">${f.size}</span>
                </div>
                <button onclick="removeUnmatched(${i})" class="text-rose-400 hover:text-rose-600 p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    } else {
        container.classList.add('hidden');
    }
    lucide.createIcons();
}

function removeUnmatched(index) {
    unmatchedFiles.splice(index, 1);
    renderUnmatched();
}

function renderChecklist() {
    const container = document.getElementById('checklist-ui');
    if (!container) return;

    container.innerHTML = docs.map((d, i) => {
        // Cek apakah dokumen ini dilindungi (tidak bisa dihapus/upload manual karena generate system)
        const isProtected = d.label.toLowerCase().includes("surat lamaran") || 
                           d.label.toLowerCase().includes("cv") || 
                           d.label.toLowerCase().includes("riwayat hidup");
        
        const hasFiles = d.files && d.files.length > 0;

        return `
        <div class="p-5 border rounded-2xl bg-white shadow-sm transition-all ${d.checked ? 'border-indigo-200' : 'opacity-50'}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex gap-3">
                    <input type="checkbox" class="custom-checkbox mt-1" ${d.checked ? 'checked' : ''} 
                        onchange="docs[${i}].checked=this.checked; sync(); renderChecklist();">
                    
                    <div>
                        <div class="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                            ${d.label}
                            ${isProtected ? '<i data-lucide="lock" class="w-3 h-3 text-indigo-400"></i>' : ''}
                        </div>
                        <p class="text-[9px] font-bold ${isProtected ? 'text-indigo-400' : (hasFiles ? 'text-emerald-500' : 'text-slate-400')}">
                            ${isProtected ? 'Dihasilkan oleh sistem' : (hasFiles ? `✓ ${d.files.length} Berkas Berhasil Diunggah` : 'Belum ada dokumen')}
                        </p>
                    </div>
                </div>

                <div class="flex gap-1">
                    <button onclick="moveDoc(${i}, -1)" class="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg" title="Pindah Atas">
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                    </button>
                    <button onclick="moveDoc(${i}, 1)" class="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg" title="Pindah Bawah">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                    ${!isProtected ? `
                        <button onclick="removeDoc(${i})" class="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg" title="Hapus Kategori">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>

            ${!isProtected ? `
                <div onclick="document.getElementById('file-input-${d.id}').click()" 
                     class="border-2 border-dashed ${hasFiles ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'} 
                            p-3 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                    <input type="file" id="file-input-${d.id}" class="hidden" multiple accept="image/*" onchange="uploadToCategory(${i}, this)">
                    <div class="flex items-center justify-center gap-2">
                        <i data-lucide="upload-cloud" class="w-4 h-4 ${hasFiles ? 'text-emerald-400' : 'text-slate-400'} group-hover:text-indigo-500"></i>
                        <span class="text-[9px] font-black uppercase ${hasFiles ? 'text-emerald-600' : 'text-slate-500'} group-hover:text-indigo-600">
                            ${hasFiles ? 'Tambah Berkas Lagi' : 'Pilih Berkas Manual'}
                        </span>
                    </div>
                </div>
            ` : ''}

            ${!isProtected && hasFiles ? `
                <div class="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    ${d.files.map((f, fi) => `
                        <div class="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-200">
                            <i data-lucide="file-image" class="w-3 h-3 text-indigo-500"></i>
                            <span class="text-[8px] font-bold text-slate-600 truncate max-w-[120px]">${f.name}</span>
                            <button onclick="removeFile(${i}, ${fi})" class="hover:bg-rose-50 p-0.5 rounded text-rose-500 transition-colors">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>`;
    }).join('');

    // Inisialisasi ulang icon Lucide agar tampil
    lucide.createIcons();
}

// Fungsi untuk mengecilkan kartu secara otomatis
function autoMinimizeCard(id) {
    // Gunakan timeout agar tidak langsung tertutup saat berpindah antar input di dalam kartu yang sama
    setTimeout(() => {
        const card = document.getElementById(`card-${id}`);
        if (card && !card.contains(document.activeElement)) {
            // Cek apakah minimal judul instansi sudah diisi agar tidak membingungkan
            const instansiInput = card.querySelector('input').value;
            if (instansiInput.trim() !== "") {
                card.classList.add('card-minimized');
            }
        }
    }, 100);
}
function minimizeAll() {
    const allCards = document.querySelectorAll('.card-item');
    allCards.forEach(card => {
        const firstInput = card.querySelector('input');
        // Hanya tutup jika sudah ada isinya agar tidak "menghilang"
        if (firstInput && firstInput.value.trim() !== "") {
            card.classList.add('card-minimized');
        }
    });
}

function expandOnlyOne(targetId) {
    // Ambil semua kartu dari semua kategori (edu, work, org, cert)
    const allCards = document.querySelectorAll('.card-item');
    
    allCards.forEach(card => {
        const cardId = parseInt(card.id.replace('card-', ''));
        if (cardId === targetId) {
            // Buka kartu yang baru ditambahkan
            card.classList.remove('card-minimized');
        } else {
            // Tutup semua kartu lainnya
            card.classList.add('card-minimized');
        }
    });
}
async function generateAI(id) {
    const card = document.getElementById(`card-${id}`);
    const textarea = document.getElementById(`ai-target-${id}`);
    const posisiInput = card.querySelector('input[placeholder="Posisi"]').value.toLowerCase();
    
    // Efek Loading
textarea.classList.add('animate-pulse');
    textarea.value = `⚡ Menghubungkan ke Database Kompetensi...
🔍 Menganalisis Standar Operasional untuk: ${posisiInput.toUpperCase()}
📝 Menyusun Deskripsi Tugas Strategis...`;

    setTimeout(() => {
        let template = "";

        // Database Template Otomatis Berdasarkan Kata Kunci Posisi
        if (posisiInput.includes("operator produksi")) {
            template = "• Mengoperasikan mesin produksi sesuai dengan Standar Operasional Prosedur (SOP).\n• Mencapai target produksi harian yang ditetapkan perusahaan dengan tingkat efisiensi 100%.\n• Melakukan pengecekan kualitas produk secara berkala untuk meminimalkan produk reject.\n• Menjaga kebersihan dan area kerja sesuai prinsip 5S/5R.";
        } 
        else if (posisiInput.includes("quality control") || posisiInput.includes("qc")) {
            template = "• Melakukan inspeksi raw material, barang setengah jadi, hingga produk jadi.\n• Mengoperasikan alat ukur presisi (Caliper, Micrometer, atau Height Gauge) sesuai spesifikasi teknis.\n• Membuat laporan ketidaksesuaian produk (NCR) dan menganalisis penyebab cacat produksi.\n• Memastikan seluruh produk yang dikirim memenuhi standar kualitas pelanggan.";
        }
        else if (posisiInput.includes("machining") || posisiInput.includes("cnc") || posisiInput.includes("milling")) {
            template = "• Mengoperasikan dan melakukan setting mesin CNC (Milling/Lathe) berdasarkan gambar teknik.\n• Melakukan penggantian mata pahat (tool change) dan penyesuaian parameter mesin.\n• Memeriksa dimensi benda kerja menggunakan alat ukur untuk memastikan akurasi sesuai toleransi.\n• Melakukan perawatan harian pada mesin untuk menjaga akurasi produksi.";
        }
        else if (posisiInput.includes("maintenance") || posisiInput.includes("teknisi")) {
            template = "• Melaksanakan Preventive Maintenance (PM) secara berkala pada mesin produksi dan fasilitas pabrik.\n• Melakukan perbaikan cepat (Troubleshooting) pada kerusakan mekanik maupun elektrikal.\n• Mengelola ketersediaan suku cadang (spare parts) kritis untuk meminimalkan downtime.\n• Melakukan dokumentasi setiap aktivitas perbaikan dan pemeliharaan mesin.";
        }
        else if (posisiInput.includes("material control") || posisiInput.includes("ppic") || posisiInput.includes("gudang")) {
            template = "• Mengontrol ketersediaan material produksi agar proses manufaktur berjalan lancar.\n• Melakukan stock opname secara rutin dan memastikan akurasi data antara fisik dan sistem (ERP/SAP).\n• Mengatur alur keluar masuk barang berdasarkan prinsip FIFO/FEFO.\n• Berkoordinasi dengan departemen pengadaan terkait jadwal kedatangan material.";
        }
        else if (posisiInput.includes("forklift")) {
            template = "• Mengoperasikan unit Forklift untuk mobilisasi material dan produk jadi secara aman.\n• Melakukan pemuatan (loading) dan pembongkaran (unloading) barang dari truk/kontainer.\n• Melakukan pengecekan rutin harian pada unit forklift (bahan bakar, oli, dan sistem hidrolik).\n• Memastikan pemindahan barang dilakukan tepat waktu tanpa adanya kerusakan (Zero Damage).";
        }
        else {
            // Template umum jika posisi tidak spesifik
            template = "• Melaksanakan tugas harian sesuai dengan instruksi kerja dan target yang diberikan.\n• Berkolaborasi dengan tim untuk meningkatkan produktivitas dan efisiensi kerja.\n• Mematuhi standar keselamatan dan kesehatan kerja (K3) di lingkungan perusahaan.\n• Memberikan laporan berkala mengenai hasil kerja kepada atasan langsung.";
        }

        textarea.value = template;
        textarea.classList.remove('animate-pulse');
        
        // Update Store data
        update('work', id, 'd', template);
        sync();
    }, 800);
}

function createPage(type = 'cv') {
    const p = document.createElement('div'); 
    p.className = `page ${type}-page`;
    
    // Ambil tema aktif
    const activeTheme = document.getElementById('cv-template').value;
    p.setAttribute('data-theme', activeTheme);
    
    
    // 1. Buat Container Watermark
    const wm = document.createElement('div');
    wm.className = 'watermark';
    
    // 2. Isi Watermark (Contoh: SIFURA CV)
    // Anda bisa menyesuaikan jumlah baris dan teks di sini
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'wm-row';
        row.innerHTML = `
            <span class="wm-text">SIFURA CV</span>
            <span class="wm-text">SIFURA CV</span>
            <span class="wm-text">SIFURA CV</span>
        `;
        wm.appendChild(row);
    }
    
    // 3. Masukkan Watermark dan Vessel ke dalam Page
    p.appendChild(wm);
    p.innerHTML += `<div class="vessel"></div>`;
    
    document.getElementById('preview-panel').appendChild(p);
    return p.querySelector('.vessel');
}

let currentVessel;
const PAGE_MAX_PX = 1055;

function appendSmart(html) {
    const wrapper = document.createElement('div'); wrapper.innerHTML = html;
    const elements = Array.from(wrapper.childNodes);
    elements.forEach(el => {
        if (el.nodeName === 'UL') {
            const listItems = Array.from(el.querySelectorAll('li'));
            let newList = document.createElement('ul'); newList.className = 'cv-list'; currentVessel.appendChild(newList);
            listItems.forEach(li => {
                newList.appendChild(li);
                if (currentVessel.offsetHeight > PAGE_MAX_PX) {
                    newList.removeChild(li); currentVessel = createPage('cv');
                    newList = document.createElement('ul'); newList.className = 'cv-list'; currentVessel.appendChild(newList); newList.appendChild(li);
                }
            });
        } else if (el.nodeType === 1) {
            currentVessel.appendChild(el);
            if (currentVessel.offsetHeight > PAGE_MAX_PX) {
                currentVessel.removeChild(el); currentVessel = createPage('cv'); currentVessel.appendChild(el);
            }
        }
    });
}

// Update fungsi parseBullets di script.js
function parseBullets(text) {
    if (!text || !text.trim()) return "";
    const items = text.split('\n').filter(line => line.trim() !== "");
    
    // Gunakan class agar mengikuti aturan di style.css
    return `<ul class="cv-list">${items.map(i => {
        let cleanText = i.replace(/^•\s*/, '').trim();
        let formattedText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
        return `<li>${formattedText}</li>`;
    }).join('')}</ul>`;
}

function addManualDoc() {
    const input = document.getElementById('manual-file-name');
    if (!input.value.trim()) return;
    docs.push({ id: Date.now(), label: input.value, files: [], checked: true });
    input.value = "";
    renderChecklist();
    sync();
}

function bersihkanTandaBaca(teks) {
    if (!teks) return "";
    return teks
        .replace(/([,.!?;:])(?=[^\s])/g, '$1 ') // Tambah spasi setelah tanda baca
        .replace(/\s+/g, ' ')                  // Hapus spasi ganda
        .trim();
}

async function sync() {
    const preview = document.getElementById('preview-panel'); 
    const layout = document.getElementById('cv-layout').value;
    const selectedTheme = document.getElementById('cv-template').value;
    preview.innerHTML = "";
    const nameVal = document.getElementById('in-name').value;
    const pobInput = document.getElementById('in-pob');
    // Membesarkan huruf depan tempat lahir secara otomatis
    const pob = titleCase(pobInput.value);

    // --- 1. HALAMAN SURAT ---
   if (document.getElementById('cl-toggle').checked) {
        let v = createPage('surat');
        const city = document.getElementById('cl-city').value;
        const nameVal = document.getElementById('in-name').value;
        const dateStr = document.getElementById('cl-date-toggle').checked ? formatTanggalIndo(new Date()) : '';
        
        const isSigActive = document.getElementById('cl-sig-toggle')?.checked || false;
        const isParafManual = document.getElementById('cl-paraf-toggle')?.checked || false;

        // Render Tanda Tangan: Dibuat memenuhi container tanpa posisi absolute yang liar
        const sigImgHtml = (isSigActive && signatureData) 
            ? `<img src="${signatureData}" style="max-height: 80px; width: auto; mix-blend-mode: multiply; display: block; margin: 0 auto;">` 
            : '';

        v.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:40px; color: #000;">
                <div>Hal: Lamaran Pekerjaan</div>
                <div>${city ? city + ', ' : ''}${dateStr}</div>
            </div>

            <div style="white-space:pre-line; text-align:justify; color: #000; margin-bottom: 50px;">
                ${document.getElementById('cl-body').value || ''}
            </div>

            <div style="margin-left: auto; width: fit-content; text-align: center; display: flex; flex-direction: column; align-items: center; color: #000;">
                <p style="margin: 0; margin-bottom: 5px;">Hormat saya,</p>
                
                <div style="min-height: 60px; display: flex; align-items: center; justify-content: center; padding: 5px 0;">
                    ${sigImgHtml}
                </div>
                
                <div style="border-bottom: ${isParafManual ? '1.5pt solid black' : 'none'}; min-width: 160px; margin-top: 5px;">
                    <b style="font-size: 11pt;">${titleCase(nameVal) || '(Nama Lengkap)'}</b>
                </div>
            </div>
        `;
    }

 if (document.getElementById('cv-toggle').checked) {
        const isPhotoActive = document.getElementById('photo-toggle').checked;
        const dob = document.getElementById('in-dob').value;
       const dStr = dob ? (() => {
    const d = new Date(dob);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('id-ID', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
})() : '';
        
        const infoParts = [];
        if (pob || dStr) infoParts.push(`${pob || ''}${pob && dStr ? ', ' : ''}${dStr}`);
        if (document.getElementById('in-tb').value) infoParts.push(`TB: ${document.getElementById('in-tb').value}cm`);
        if (document.getElementById('in-bb').value) infoParts.push(`BB: ${document.getElementById('in-bb').value}kg`);
        if (document.getElementById('in-status').value) infoParts.push(document.getElementById('in-status').value);

        const commonHeaderHtml = `
            <div id="cv-header-section" style="display:flex; ${isPhotoActive ? 'flex-direction:row;' : 'flex-direction:column;'} align-items:center; gap:25px; margin-bottom:20px; width:100%;">
                ${isPhotoActive ? `<div style="width:30mm; height:40mm; background:#fafafa; border:1px solid #eee; overflow:hidden; flex-shrink:0;">${photo ? `<img src="${photo}" style="width:100%; height:100%; object-fit:cover">` : ''}</div>` : ''}
                <div style="flex:1; display:flex; flex-direction:column; ${isPhotoActive ? 'text-align:left; align-items:flex-start' : 'text-align:center; align-items:center'}; width:100%;">
                    <h1 style="font-family: 'Times New Roman', serif !important; font-size:24pt !important; font-weight:bold; margin-bottom:4px; color:#000000;">${nameVal || ''}</h1>
                    <div style="font-family: 'Times New Roman', serif !important; font-size:11pt !important; color:#000000; margin-bottom:8px;">${infoParts.join(' • ')}</div>
                    <div style="display:flex; flex-direction:column; gap:4px; ${isPhotoActive ? 'align-items:flex-start' : 'align-items:center'};">
                        <div style="display:flex; flex-wrap:wrap; gap:10px; ${isPhotoActive ? '' : 'justify-content:center'}; align-items:center; font-family: 'Times New Roman', serif !important; font-size:11pt !important; color:#000000;">
                ${document.getElementById('in-wa').value ? `<span>${document.getElementById('in-wa').value}</span>` : ''}
                
                ${document.getElementById('in-wa').value && document.getElementById('in-email').value ? `<span style="color:#94a3b8;">|</span>` : ''}
                
                ${document.getElementById('in-email').value ? `<span style="text-decoration: none;">${document.getElementById('in-email').value}</span>` : ''}
            </div>
                        ${document.getElementById('in-address').value ? `<div class="contact-item"><span>${formatAlamatOtomatis(document.getElementById('in-address').value)}</span></div>` : ''}
                    </div>
                </div>
            </div>`;

        currentVessel = createPage('cv');
        currentVessel.closest('.page').setAttribute('data-layout', '1-col');
        currentVessel.closest('.page').setAttribute('data-theme', selectedTheme);
        currentVessel.innerHTML = commonHeaderHtml;

        if (document.getElementById('in-about').value) {
            appendSmart(`<div class="section-title">Profil Profesional</div><div class="cv-profile-text">${document.getElementById('in-about').value}</div>`);
        }

        const cats = [{ k: 'edu', l: 'Pendidikan' }, { k: 'work', l: 'Pengalaman Kerja' }, { k: 'org', l: 'Pengalaman Organisasi' }, { k: 'cert', l: 'Pelatihan & Sertifikasi' }];
        
        cats.forEach(c => {
            if (store[c.k].length > 0) {
                appendSmart(`<div class="section-title">${c.l}</div>`);
                store[c.k].forEach((i, index) => {
                    const borderStyle = index > 0 ? 'border-top: 0.5pt solid #e5e7eb; margin-top: 10px; padding-top: 8px;' : '';
                    const itemHtml = `
                        <div style="${borderStyle} margin-bottom: 2px; page-break-inside: avoid;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <div style="font-weight: 800; font-size: 11pt; color: #000000 !important;">${titleCase(i.t)}</div>
                                <span style="font-size: 11pt; font-weight: 700; color: #334155;">${i.s}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 1px;">
                                <div class="sub-title-italic">${titleCase(i.sub)}</div>
                                ${i.extra ? `<div style="font-size: 11pt; font-weight: 800; color: #4f46e5; background: #f5f3ff; padding: 1px 7px; border-radius: 4px; border: 0.5pt solid #ddd6fe; text-transform: uppercase;">${i.extra}</div>` : ''}
                            </div>
                        </div>
                        ${i.d ? parseBullets(i.d) : ''}`;
                    appendSmart(itemHtml);
                });
            }
        });

        if (document.getElementById('in-skills').value) appendSmart(`<div class="section-title">Keahlian ( Hard & Soft Skill )</div>` + parseBullets(document.getElementById('in-skills').value));
        if (document.getElementById('in-langs').value) appendSmart(`<div class="section-title">Bahasa</div>` + parseBullets(document.getElementById('in-langs').value));
    }
    // --- 3. HALAMAN LAMPIRAN BERKAS ---
if (document.getElementById('docs-toggle').checked) {
    const activeDocs = docs.filter(d => d.checked && 
        !d.label.toLowerCase().includes("surat lamaran") && 
        !d.label.toLowerCase().includes("cv")
    );

    const identityKeywords = ["ktp", "npwp", "sim a", "sim c"];
    const docsToMerge = activeDocs.filter(d => {
        const labelLower = d.label.toLowerCase().trim();
        return identityKeywords.some(key => labelLower.includes(key)) && d.files.length > 0;
    });

    const otherDocs = activeDocs.filter(d => {
        const labelLower = d.label.toLowerCase().trim();
        return !identityKeywords.some(key => labelLower.includes(key));
    });

    if (docsToMerge.length > 0) {
        const allIdentityFiles = [];
        docsToMerge.forEach(d => {
            if (d.files.length > 0) {
                allIdentityFiles.push({ label: d.label, data: d.files[0].data });
            }
        });

        const displayFiles = allIdentityFiles.slice(0, 4);
        const total = displayFiles.length;
        
        // --- LOGIKA HEADER DINAMIS ---
        // Jika hanya 1 file, gunakan label file tersebut (misal: KTP). 
        // Jika lebih, gunakan "Dokumen Identitas"
        const dynamicHeader = total === 1 ? displayFiles[0].label : "Dokumen Identitas";

        let cardWidth = "400px"; 
        let cardHeight = "240px"; 

        if (total === 1) {
            cardWidth = "500px"; // Sedikit lebih lebar untuk tampilan tunggal
            cardHeight = "320px";
        } else if (total === 2) {
            cardWidth = "480px";
            cardHeight = "310px";
        } else {
            cardWidth = "300px";
            cardHeight = "200px";
        }

        let v = createPage('cv');
        const pageEl = v.closest('.page');
        if (pageEl.querySelector('.watermark')) pageEl.querySelector('.watermark').remove();
        v.style.display = "flex";
        v.style.flexDirection = "column";
        v.style.minHeight = "100%";
        v.innerHTML = `

            <div class="section-title" style="margin-bottom: 40px !important;">
                ${dynamicHeader}
            </div>
            
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex: 1;
                gap: 30px;
                width: 100%;
            ">
                ${displayFiles.map(file => `
                    <div style="display: flex; flex-direction: column; gap: 10px; width: ${cardWidth}; max-width: 100%;">
                        ${total > 1 ? `
                            <span style="font-family: 'Times New Roman', serif; font-size: 10pt; font-weight: bold; text-transform: uppercase; text-align: center; display: block; color: #64748b;">
                                ${file.label}
                            </span>
                        ` : ''}
                        <div style="
                            border: 0.5pt solid #cbd5e1; 
                            background: #ffffff; 
                            border-radius: 12px; 
                            padding: 10px; 
                            height: ${cardHeight}; 
                            width: 100%;
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            overflow: hidden;
                            box-shadow: 0 2pt 4pt rgba(0,0,0,0.05);
                        ">
                            <img src="${file.data}" style="
                                max-width: 100%; 
                                max-height: 100%; 
                                object-fit: contain;
                            ">
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: auto; padding-top: 20px; text-align: right;">
                <span style="font-family: 'Times New Roman', serif; font-size: 8pt; color: #94a3b8; font-style: italic;">
                     Dokumen Lampiran - ${titleCase(nameVal)}
                </span>
            </div>
        `;
    }

    // B. Render Dokumen Lainnya (Satu Halaman Satu Berkas)
    otherDocs.forEach(d => {
        if (d.files.length > 0) {
            d.files.forEach((file, index) => {
                let v = createPage('cv');
                const pageEl = v.closest('.page');
                const existingWm = pageEl.querySelector('.watermark');
                if (existingWm) existingWm.remove();
                v.style.display = "flex";
            v.style.flexDirection = "column";
            v.style.height = "100%";
                v.innerHTML = `
                    <div class="section-title" style="margin-bottom: 25px !important;">
                        ${d.label} ${d.files.length > 1 ? `<span style="font-size: 9pt; opacity: 0.7;">(Hal. ${index + 1})</span>` : ''}
                    </div>
                    <div style="width: 100%; height: 860px; display: flex; align-items: center; justify-content: center; border: 0.5pt solid #e2e8f0; background-color: #fafafa; border-radius: 4px; overflow: hidden; padding: 10px;">
                        <img src="${file.data}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    
                     <div style="margin-top: auto; padding-top: 20px; text-align: right;">
                <span style="font-family: 'Times New Roman', serif; font-size: 8pt; color: #94a3b8; font-style: italic;">
                     Dokumen Lampiran - ${titleCase(nameVal)}
                </span>
            </div>
                `;
            });
        }
    });
}}

function applyLetterTemplate() {
    const name = document.getElementById('in-name').value || '(Nama Lengkap Anda)';
    const template = `Yth. Bapak/Ibu HRD Manager\nDi Tempat \n\nDengan hormat,\n\nMelalui surat ini, saya bermaksud untuk melamar pekerjaan di perusahaan yang Bapak/Ibu pimpin untuk posisi yang tersedia. Berdasarkan latar belakang pendidikan dan pengalaman kerja yang saya miliki, saya yakin dapat memberikan kontribusi positif bagi perusahaan.\n\nSaya memiliki motivasi tinggi untuk mempelajari hal baru. Saya adalah pribadi yang disiplin, jujur, serta mampu bekerja baik secara mandiri maupun dalam tim.\n\nBersama surat ini saya lampirkan Curriculum Vitae (CV) dan dokumen pendukung lainnya sebagai bahan pertimbangan. Besar harapan saya untuk diberikan kesempatan wawancara guna menjelaskan kualifikasi saya lebih mendalam.\n\nDemikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.`;
    document.getElementById('cl-body').value = template;
    sync();
}

function clearLetter() {
    document.getElementById('cl-body').value = "";
    sync();
}

function toggleDemoData() {

    const btn = document.getElementById('demo-template-btn');
    const btnText = document.getElementById('demo-template-text');
    
    
    if (!isDemoActive) {
        // --- 1. DATA IDENTITAS ---
        
        document.getElementById('in-name').value = "HERI ARIYANTO, S.KOM.";
        document.getElementById('in-pob').value = "Pemalang";
        document.getElementById('in-dob').value = "1995-08-17";
        document.getElementById('in-tb').value = "175";
        document.getElementById('in-bb').value = "68";
        document.getElementById('in-status').value = "Belum Menikah";
        document.getElementById('in-wa').value = "0812-3456-7890";
        document.getElementById('in-email').value = "heri.ariyanto@email.com";
        document.getElementById('in-address').value = "Jl. Taman Selatan No. 45, RT 02/RW 05, Kelurahan Beji, Kecamatan Taman, Kabupaten Pemalang, Jawa Tengah 52361";
        
        // PROFIL PROFESIONAL (Dibuat sangat naratif dan teknis)
        document.getElementById('in-about').value = "Profesional Teknologi Informasi yang berdedikasi dengan pengalaman lebih dari 6 tahun dalam arsitektur jaringan, administrasi sistem server enterprise, dan manajemen keamanan siber. Memiliki rekam jejak yang terbukti dalam merancang solusi infrastruktur IT yang skalabel untuk mendukung pertumbuhan bisnis yang dinamis. Ahli dalam konfigurasi perangkat keras Cisco dan MikroTik, manajemen pusat data (Data Center), serta implementasi teknologi virtualisasi tingkat lanjut. Saya memiliki kemampuan kepemimpinan tim teknis yang kuat, komunikasi yang efektif untuk menjembatani kebutuhan teknis dengan tujuan bisnis, dan komitmen tinggi terhadap standar operasional prosedur yang ketat demi menjaga integritas data serta ketersediaan sistem selama 24/7.";

        // --- 2. SURAT LAMARAN (Otomatis Terisi) ---
        document.getElementById('cl-city').value = "Pemalang";
        document.getElementById('cl-date-toggle').checked = true;
        applyLetterTemplate();

        // --- 3. PENDIDIKAN (Dibuat 3 Entry agar memakan ruang) ---
        store.edu = [
            {
                id: Date.now() + 1,
                t: 'Universitas Dian Nuswantoro (UDINUS)',
                sub: 'Sarjana Komputer - Teknik Informatika',
                s: '2014 - 2018',
                extra: 'IPK: 3.88 / 4.00 (Cumlaude)',
                d: '• Konsentrasi pada Keamanan Informasi dan Manajemen Jaringan Komputer.\n• Ketua Himpunan Mahasiswa Teknik Informatika (HMTI) periode 2016-2017.\n• Meraih penghargaan skripsi terbaik tingkat fakultas dengan fokus penelitian pada optimasi protokol routing dinamis.\n• Aktif sebagai Asisten Laboratorium untuk mata kuliah Sistem Operasi dan Jaringan Komputer.'
            },
            {
                id: Date.now() + 2,
                t: 'SMK Negeri 1 Pemalang',
                sub: 'Teknik Komputer dan Jaringan (TKJ)',
                s: '2011 - 2014',
                extra: 'Peringkat 1 Umum',
                d: '• Juara 1 Lomba Kompetensi Siswa (LKS) IT Network System Administration tingkat Provinsi Jawa Tengah.\n• Tersertifikasi secara internasional melalui program Cisco Networking Academy (NetAcad).\n• Memimpin proyek peremajaan infrastruktur jaringan laboratorium sekolah sebagai bagian dari tugas akhir.'
            }
        ];

        // --- 4. PENGALAMAN KERJA (Sangat Detail untuk memaksa Page Break) ---
        store.work = [
            {
                id: Date.now() + 3,
                t: 'PT. Infrastruktur Digital Nusantara Tbk.',
                sub: 'Lead Network & Security Engineer',
                s: 'Januari 2021 - Sekarang',
                d: '• Bertanggung jawab penuh atas operasional dan keamanan jaringan backbone di 15 kantor operasional regional.\n• Merancang strategi Disaster Recovery Plan (DRP) yang berhasil mengurangi waktu pemulihan sistem (RTO) hingga 50%.\n• Mengelola anggaran pengadaan perangkat IT tahunan senilai Rp 2 Miliar dengan fokus pada efisiensi biaya vendor.\n• Mengimplementasikan teknologi Software-Defined Networking (SDN) untuk otomatisasi manajemen lalu lintas data.\n• Melakukan penetration testing secara berkala dan hardening pada lebih dari 50 server Linux dan Windows.\n• Mengawasi tim technical support tingkat 2 dan 3 dalam penyelesaian insiden jaringan berskala prioritas tinggi.'
            },
           
            {
                id: Date.now() + 5,
                t: 'PT. Media Data Komunika',
                sub: 'IT Support & Network Technician',
                s: 'Januari 2017 - Mei 2018',
                d: '• Melakukan instalasi kabel struktural (FO & UTP) serta konfigurasi perangkat end-user untuk klien korporat.\n• Memberikan dukungan teknis on-site dan remote untuk penyelesaian masalah konektivitas internet dan intranet.\n• Melakukan pemeliharaan rutin pada perangkat UPS dan sistem pendingin ruang server demi menjaga stabilitas hardware.'
            }
        ];

        // --- 5. ORGANISASI & SERTIFIKASI (Tambahan volume teks) ---
        store.org = [
            {
                id: Date.now() + 6,
                t: 'Asosiasi Teknisi Jaringan Indonesia (ATJI)',
                sub: 'Ketua Bidang Pengembangan Kompetensi',
                s: '2022 - Sekarang',
                d: '• Menyelenggarakan sertifikasi nasional bagi 500+ tenaga kerja IT di wilayah Jawa Tengah.'
            }
        ];
        store.cert = [
            {
                id: Date.now() + 7,
                t: 'Cisco Certified Network Professional (CCNP) Enterprise',
                sub: 'Cisco Systems Inc.',
                s: '2023',
                d: 'Sertifikasi tingkat profesional dalam desain dan implementasi jaringan skala luas (WAN).'
            },
           
        ];

        // --- 6. KEAHLIAN & BAHASA ---
        document.getElementById('in-skills').value = "Advanced Networking (Cisco, Juniper, MikroTik)\nServer Virtualization (VMware, Proxmox, Hyper-V)\nCloud Infrastructure (AWS, Google Cloud, Azure)\nAutomation & Scripting (Python, Bash, Ansible)\nNetwork Security & Firewall Management\nDatabase Administration (SQL, NoSQL)\nIT Service Management (ITIL Foundation)";
        document.getElementById('in-langs').value = "Bahasa Indonesia (Lisan & Tulisan - Sangat Aktif)\nBahasa Inggris (Professional & Technical - Aktif)\nBahasa Jepang (Percakapan Dasar - Pasif)";

        // AKTIFKAN CHECKBOX
        document.getElementById('cv-toggle').checked = true;
        document.getElementById('cl-toggle').checked = true;
        document.getElementById('docs-toggle').checked = true;
    isDemoActive = true;
        btnText.innerText = "Hapus Contoh";
        btn.classList.add('demo-active-mode');
        

    } else {
        // RESET TOTAL (Tanpa reload)
        const inputs = document.querySelectorAll('.input-ui, #cl-city');
        inputs.forEach(input => input.value = "");
        store = { work: [], edu: [], org: [], cert: [] };
        photo = null;
        
        document.getElementById('cv-toggle').checked = false;
    document.getElementById('cl-toggle').checked = false;
    document.getElementById('docs-toggle').checked = false;
    document.getElementById('photo-toggle').checked = false;
    document.getElementById('cl-date-toggle').checked = false;
     isDemoActive = false;   
    btnText.innerText = "Isi Contoh";
        btn.classList.remove('demo-active-mode');
       
    }

   lucide.createIcons();
    renderLists('edu'); renderLists('work'); renderLists('org'); renderLists('cert');
    sync();
}

function uploadToCategory(index, input) {
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    let successCount = 0;

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            docs[index].files.push({
                name: file.name,
                data: URL.createObjectURL(file),
                type: file.type,
                timestamp: new Date().toLocaleTimeString('id-ID')
            });
            successCount++;
        } else {
            alert(`Format file "${file.name}" tidak didukung. Harap gunakan format gambar (JPG/PNG).`);
        }
    });

    if (successCount > 0) {
        // Feedback konsol atau bisa dikembangkan ke Toast Notification
        console.log(`Berhasil mengunggah ${successCount} dokumen ke kategori ${docs[index].label}`);
    }

    input.value = '';
    renderChecklist();
    sync();
}

function resetData() { 
    if (confirm("Reset semua data? Draft yang tersimpan juga akan dihapus.")) { 
        localStorage.removeItem('sifura_cv_draft');
        location.reload(); 
    }}
function handleCardBlur(id) {
    const card = document.getElementById(`card-${id}`);
    
    // Memberikan delay kecil agar transisi fokus antar input 
    // di dalam kartu yang sama tidak dianggap sebagai "keluar area".
    setTimeout(() => {
        // Cek apakah elemen yang saat ini aktif (fokus) berada di dalam kartu ini
        if (card && !card.contains(document.activeElement)) {
            // Jika fokus sudah benar-benar di luar kartu, kecilkan kartu
            card.classList.add('card-minimized');
        }
    }, 150); 
}
function del(type, id) { 
    store[type] = store[type].filter(x => x.id !== id); 
    renderLists(type); // Ini akan memicu render ulang dengan keadaan tertutup
    sync(); 
}
function moveItem(type, index, step) {
    const targetIndex = index + step;
    
    // Pastikan target masih dalam jangkauan array
    if (targetIndex >= 0 && targetIndex < store[type].length) {
        // Tukar posisi data
        const temp = store[type][index];
        store[type][index] = store[type][targetIndex];
        store[type][targetIndex] = temp;
        
        // Render ulang daftar dan sinkronisasi ke preview
        renderLists(type);
        sync();
        
        // Opsional: Tetap buka kartu yang sedang dipindah
        setTimeout(() => expandOnlyOne(store[type][targetIndex].id), 50);
    }
}
 function renderLists(type) {
    const container = document.getElementById(`list-${type}`);
    container.innerHTML = store[type].map((item, index) => {
        const subPlaceholder = (type === 'edu') ? 'Jurusan' : 'Posisi';
        const displayName = item.t.trim() !== "" ? item.t : "Nama Instansi Belum Diisi";
        
        return `
            <div id="card-${item.id}" class="card-item card-minimized border-l-4 border-indigo-500 bg-white shadow-sm mb-3" 
                 onclick="expandOnlyOne(${item.id})"
                 onfocusout="handleCardBlur(${item.id})">
                
               <div class="flex justify-between items-center mb-3 border-b border-slate-50 pb-2 header-nav">
                    <div class="flex items-center gap-2 overflow-hidden mr-2">
                        <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-full">
                            ${index + 1}
                        </span>
                        <span class="text-[10px] font-bold text-slate-700 truncate uppercase tracking-tight">
                            ${displayName}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="moveItem('${type}', ${index}, -1); event.stopPropagation();" 
                                class="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors">
                            <i data-lucide="chevron-up" class="w-4 h-4"></i>
                        </button>
                        <button onclick="moveItem('${type}', ${index}, 1); event.stopPropagation();" 
                                class="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors">
                            <i data-lucide="chevron-down" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <input type="text" class="input-ui mb-2 font-bold" placeholder="Nama Instansi/Perusahaan" 
                       value="${item.t}" 
                       oninput="update('${type}',${item.id},'t',this.value)">
                
                <input type="text" class="input-ui mb-2 text-indigo-600" placeholder="${subPlaceholder}" 
                       value="${item.sub}" 
                       oninput="update('${type}',${item.id},'sub',this.value)">
                
                <div class="${type === 'edu' ? 'grid grid-cols-2 gap-2' : 'block'}">
                    <input type="text" class="input-ui mb-2" placeholder="Periode" 
                           value="${item.s}" 
                           oninput="this.value = titleCase(this.value); update('${type}',${item.id},'s',this.value)">
                    ${type === 'edu' ? `<input type="text" class="input-ui mb-2" placeholder="Nilai" value="${item.extra}" oninput="update('${type}',${item.id},'extra',this.value)">` : ''}
                </div>

                ${type === 'work' ? `
                    <div class="relative group mt-3">
                        <textarea id="ai-target-${item.id}" 
                                  class="input-ui text-[11px] bg-slate-50/30 min-h-[150px] pr-10 leading-relaxed" 
                                  oninput="update('${type}',${item.id},'d',this.value)">${item.d}</textarea>
                        <button onclick="generateAI(${item.id}); event.stopPropagation();" class="absolute bottom-3 right-3 bg-slate-900 text-white p-2 rounded-lg">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                ` : `
                    <textarea class="input-ui text-xs bg-slate-50 min-h-[80px]" 
                              oninput="update('${type}',${item.id},'d',this.value)">${item.d}</textarea>
                `}
                
                <div class="flex justify-end mt-2">
                    <button onclick="del('${type}',${item.id}); event.stopPropagation();" 
                            class="text-rose-500 text-[10px] font-black uppercase hover:bg-rose-50 px-2 py-1 rounded">
                        Hapus Item
                    </button>
                </div>
            </div>`;
    }).join('');
    lucide.createIcons();
}
function moveDoc(idx, step) {
    const target = idx + step;
    if (target >= 0 && target < docs.length) {
        [docs[idx], docs[target]] = [docs[target], docs[idx]];
        renderChecklist(); sync();
    }
}

function removeDoc(idx) {
    if (confirm("Hapus kategori ini?")) { docs.splice(idx, 1); renderChecklist(); sync(); }
}

function removeFile(dIdx, fIdx) {
    docs[dIdx].files.splice(fIdx, 1);
    renderChecklist(); sync();
}
function loadFromLocal() {
    const savedData = localStorage.getItem('sifura_cv_draft');
    if (!savedData) return;

    try {
        const d = JSON.parse(savedData);
        
        // 1. Pulihkan Store (Data Dinamis)
        store = d.store || { work: [], edu: [], org: [], cert: [] };

        // 2. Pulihkan Input Text & Textarea
        if (d.inputs) {
            Object.entries(d.inputs).forEach(([id, value]) => {
                const el = document.getElementById(`in-${id}`) || document.getElementById(`cl-${id}`);
                if (el) el.value = value;
            });
        }

        // 3. Pulihkan Toggles
        if (d.toggles) {
            const toggleMap = {
                'cv-toggle': d.toggles.cv,
                'photo-toggle': d.toggles.photo,
                'cl-toggle': d.toggles.cl,
                'cl-date-toggle': d.toggles.clDate,
                'docs-toggle': d.toggles.docs
            };
            Object.entries(toggleMap).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el) el.checked = val;
            });
        }

        // 4. Pulihkan Layout
        if (d.layout) {
            updateLayout(d.layout); // Memanggil fungsi agar UI tombol ikut berubah
        }

        // 5. Refresh Semua Tampilan
        renderLists('edu'); renderLists('work'); renderLists('org'); renderLists('cert');
        renderChecklist();
        sync();
    } catch (e) {
        console.error("Gagal memuat draft:", e);
    }
}
/**
 * FUNGSI EKSPOR SUPER: Menyimpan Teks + Foto Profil + Semua Lampiran Berkas + Tanda Tangan
 */
async function exportDataToFile() {
    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Memproses...';
    lucide.createIcons();

    // 1. Ambil data mentah
    const dataObj = {
        store: store,
        inputs: {
            name: document.getElementById('in-name').value,
            pob: document.getElementById('in-pob').value,
            dob: document.getElementById('in-dob').value,
            tb: document.getElementById('in-tb').value,
            bb: document.getElementById('in-bb').value,
            status: document.getElementById('in-status').value,
            wa: document.getElementById('in-wa').value,
            email: document.getElementById('in-email').value,
            address: document.getElementById('in-address').value,
            about: document.getElementById('in-about').value,
            city: document.getElementById('cl-city').value,
            skills: document.getElementById('in-skills').value,
            langs: document.getElementById('in-langs').value,
            letterBody: document.getElementById('cl-body').value
        },
        toggles: {
            cv: document.getElementById('cv-toggle').checked,
            photo: document.getElementById('photo-toggle').checked,
            cl: document.getElementById('cl-toggle').checked,
            clDate: document.getElementById('cl-date-toggle').checked,
            docs: document.getElementById('docs-toggle').checked
        },
        layout: document.getElementById('cv-layout').value,
        template: document.getElementById('cv-template').value,
        photoData: photo,
        signatureData: signatureData, // TAMBAHKAN BARIS INI: Menyimpan data tanda tangan
        docsList: []
    };

    // 2. Proses lampiran berkas ke Base64 (Internal)
    for (let doc of docs) {
        let newDoc = { ...doc, files: [] };
        for (let file of doc.files) {
            const b64 = await fetch(file.data).then(r => r.blob()).then(blob => {
                return new Promise((res) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result);
                    reader.readAsDataURL(blob);
                });
            });
            newDoc.files.push({ name: file.name, type: file.type, data: b64 });
        }
        dataObj.docsList.push(newDoc);
    }

    // 3. Ubah JSON menjadi String, lalu Encode ke Base64
    const jsonString = JSON.stringify(dataObj);
    const encodedData = btoa(unescape(encodeURIComponent(jsonString)));

    // 4. Download dengan ekstensi .sifura
    const nameVal = document.getElementById('in-name').value.trim() || 'DATA';
    const safeName = nameVal.replace(/[/\\?%*:|"<>]/g, '');
    const fileName = `${safeName}.sifura`;
    
    const blob = new Blob([encodedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    btn.innerHTML = originalContent;
    lucide.createIcons();
}
async function importDataFromFile(input) {
    if (!input.files || !input.files[0]) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // 1. Ambil string Base64 dan Decode kembali ke JSON
            const decodedString = decodeURIComponent(escape(atob(e.target.result)));
            const d = JSON.parse(decodedString);

            if (!d.store || !d.inputs) throw new Error("Format file tidak dikenali.");

            // 2. Pulihkan data
            store = d.store;
            photo = d.photoData || null;
            signatureData = d.signatureData || null; // Memulihkan variabel tanda tangan

            if (d.docsList) {
                for (let doc of d.docsList) {
                    for (let file of doc.files) {
                        if (file.data.startsWith('data:image')) {
                            const res = await fetch(file.data);
                            const blob = await res.blob();
                            file.data = URL.createObjectURL(blob);
                        }
                    }
                }
                docs = d.docsList;
            }

            // 3. Update UI & Input
            if (d.inputs) {
                Object.entries(d.inputs).forEach(([id, value]) => {
                    let targetId = (id === 'letterBody') ? 'cl-body' : id;
                    const el = document.getElementById(targetId) || 
                               document.getElementById(`in-${id}`) || 
                               document.getElementById(`cl-${id}`);
                    if (el) el.value = value || "";
                });
            }

            // 4. Pulihkan Toggles & Template
            if (d.toggles) {
                document.getElementById('cv-toggle').checked = d.toggles.cv;
                document.getElementById('photo-toggle').checked = d.toggles.photo;
                document.getElementById('cl-toggle').checked = d.toggles.cl;
                document.getElementById('cl-date-toggle').checked = d.toggles.clDate;
                document.getElementById('docs-toggle').checked = d.toggles.docs;
            }

            if (d.layout) updateLayout(d.layout);
            if (d.template) {
                document.getElementById('cv-template').value = d.template;
                const ats = document.getElementById('cv-template-ats');
                const crv = document.getElementById('cv-template-creative');
                if (d.template.startsWith('ats')) { ats.value = d.template; crv.selectedIndex = -1; }
                else { crv.value = d.template; ats.selectedIndex = -1; }
            }

            // 5. Refresh UI List & Berkas
            renderLists('edu'); renderLists('work'); renderLists('org'); renderLists('cert');
            renderChecklist();

            // 6. Tampilkan Status Foto Profil (jika ada)
            if (photo) {
                document.getElementById('photo-status').classList.remove('hidden');
                document.getElementById('photo-dropzone').classList.add('hidden');
            }

            // 7. Logika Otomatisasi Tanda Tangan Digital
            const sigToggle = document.getElementById('cl-sig-toggle');
            const sigStatus = document.getElementById('sig-status');

            if (signatureData) {
                // Aktifkan Status Visual & Centang Toggle Secara Otomatis
                if (sigStatus) sigStatus.classList.remove('hidden');
                if (sigToggle) sigToggle.checked = true; 
            } else {
                if (sigStatus) sigStatus.classList.add('hidden');
                if (sigToggle) sigToggle.checked = false;
            }

            sync();
            alert("Data Sifura Berhasil Dimuat!");

        } catch (err) {
            console.error(err);
            alert("File rusak atau bukan format .sifura yang valid!");
        }
    };
    reader.readAsText(input.files[0]);
}
// 1. Ganti fungsi tombol download di HTML dari executePrint() menjadi openDownloadModal()
function openDownloadModal() {
    document.getElementById('download-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeDownloadModal() {
    document.getElementById('download-modal').classList.add('hidden');
}

// 2. Jalur Original
function triggerOriginalPrint() {
    closeDownloadModal();
   executePrint(0.9, 0.8); 
}

function triggerCompressedPrint() {
    const quality = document.getElementById('compress-slider').value / 100;
    const dpiScale = document.getElementById('dpi-slider').value / 100; // Ambil nilai DPI
    closeDownloadModal();
    executePrint(quality, dpiScale);
}

async function executePrint(quality = 0.4, dpiScale = 1.0) {
    const btn = document.querySelector('button[onclick="openDownloadModal()"]');
    const originalContent = btn.innerHTML;
    const nameVal = document.getElementById('in-name').value.trim() || 'DOKUMEN';
    const safeName = nameVal.replace(/[/\\?%*:|"<>]/g, '');
    
    // Simpan judul asli halaman
    const originalTitle = document.title;

    // Tentukan Nama File berdasarkan kualitas
    if (quality >= 0.9 && dpiScale >= 0.8 ) {
        document.title = `Ukuran Asli CV ${safeName}`;
    } else {
        document.title = `CV & Berkas ${safeName}`;
    }

    const images = document.querySelectorAll('.page img');
    const originalSources = new Map();

    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Memproses...';
    lucide.createIcons();

    try {
        document.body.classList.add('printing-mode');

        if (quality < 1.0 || dpiScale < 1.0) {
            for (let img of images) {
                if (img.src.startsWith('data:image') || img.src.startsWith('blob:')) {
                    originalSources.set(img, img.src);
                    const compressedDataUrl = await compressImage(img.src, parseFloat(quality), parseFloat(dpiScale));
                    img.src = compressedDataUrl;
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        window.print();

        // Kembalikan ke kondisi semula
        setTimeout(() => {
            document.title = originalTitle; // Kembalikan judul tab browser
            originalSources.forEach((src, img) => {
                img.src = src;
            });
            document.body.classList.remove('printing-mode');
            btn.innerHTML = originalContent;
            lucide.createIcons();
        }, 1000);

    } catch (error) {
        console.error("Gagal proses dokumen:", error);
        document.title = originalTitle;
        document.body.classList.remove('printing-mode');
        btn.innerHTML = originalContent;
    }
}

function compressImage(src, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tentukan Resolusi Maksimal (Standard Dokumen A4)
            // Jika gambar asli sangat besar (misal 4000px), kita paksa ke 1000px
            const maxDimension = 1000; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDimension) {
                    height *= maxDimension / width;
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width *= maxDimension / height;
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Gambar ulang dengan dimensi yang sudah dikecilkan
            ctx.fillStyle = "#fff"; // Background putih untuk menghindari area transparan jadi hitam saat ke JPEG
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output paksa ke JPEG (PNG tidak bisa dikompres lewat canvas quality)
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}


sync();
window.addEventListener('DOMContentLoaded', () => {
    loadFromLocal();
    // Re-render icons setelah data dimuat
    lucide.createIcons();
});