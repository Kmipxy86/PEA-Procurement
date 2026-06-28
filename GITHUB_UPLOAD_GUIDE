# คู่มืออัปโหลดระบบ e-Form กฟภ. ขึ้น GitHub

---

## 📁 ไฟล์ที่ต้องอัปโหลด

| ไฟล์ | หน้าที่ | จำเป็น? |
|---|---|---|
| `index.html` | ไฟล์หลักของระบบ (เปลี่ยนชื่อจาก pea_eform.html) | ✅ บังคับ |
| `Code.gs` | Google Apps Script สำหรับ Google Sheets | ⬜ ไม่บังคับ |
| `README_eForm_PEA.md` | คู่มือการใช้งาน | ⬜ แนะนำ |

> ⚠️ **ต้องเปลี่ยนชื่อไฟล์** `pea_eform.html` → `index.html` เพื่อให้ GitHub Pages แสดงผลได้อัตโนมัติ

---

## 🚀 วิธีที่ 1: อัปโหลดผ่านหน้าเว็บ GitHub (ง่ายที่สุด)

### ขั้นที่ 1 — สร้าง Repository ใหม่

1. ไปที่ [github.com](https://github.com) → ล็อกอิน
2. กดปุ่ม **"+"** มุมบนขวา → **New repository**
3. ตั้งค่าดังนี้:
   - **Repository name:** `pea-eform` (หรือชื่ออื่นตามต้องการ)
   - **Description:** `ระบบ e-Form จัดซื้อจัดจ้าง กฟภ.`
   - **Visibility:** `Public` ✅ (ต้องเป็น Public ถ้าใช้ GitHub Free)
   - ☑️ เลือก **Add a README file**
4. กด **Create repository**

---

### ขั้นที่ 2 — อัปโหลดไฟล์

1. ในหน้า Repository → กด **Add file** → **Upload files**
2. ลากไฟล์เหล่านี้ใส่ในกล่อง (หรือกด **choose your files**):
   - `index.html` ← (ไฟล์ pea_eform.html ที่เปลี่ยนชื่อแล้ว)
   - `Code.gs` ← (ถ้าต้องการ)
   - `README_eForm_PEA.md` ← (ถ้าต้องการ)
3. เขียน Commit message: `เพิ่มระบบ e-Form จัดซื้อจัดจ้าง กฟภ.`
4. กด **Commit changes**

---

### ขั้นที่ 3 — เปิด GitHub Pages

1. ไปที่ **Settings** (แถบบนของ Repository)
2. เลื่อนลงมาที่เมนูซ้าย → กด **Pages**
3. ส่วน **"Build and deployment"**:
   - **Source:** เลือก `Deploy from a branch`
   - **Branch:** เลือก `main` | Folder: `/ (root)`
4. กด **Save**
5. รอ 1-2 นาที จากนั้นจะมีลิงก์แสดงขึ้นมา:
   ```
   ✅ Your site is live at https://USERNAME.github.io/pea-eform/
   ```

---

## 🚀 วิธีที่ 2: อัปโหลดผ่าน Git Command Line

สำหรับผู้ที่ติดตั้ง Git บนเครื่องแล้ว

```bash
# 1. clone repository ที่สร้างไว้
git clone https://github.com/USERNAME/pea-eform.git
cd pea-eform

# 2. คัดลอกไฟล์เข้าโฟลเดอร์
copy pea_eform.html index.html      # Windows
# cp pea_eform.html index.html      # Mac/Linux

# 3. เพิ่มไฟล์เข้า git
git add index.html
git add Code.gs
git add README_eForm_PEA.md

# 4. บันทึก commit
git commit -m "เพิ่มระบบ e-Form จัดซื้อจัดจ้าง กฟภ."

# 5. อัปโหลดขึ้น GitHub
git push origin main
```

จากนั้นเปิด GitHub Pages ตามขั้นที่ 3 ข้างต้น

---

## 🌐 URL ที่ได้หลัง Deploy

| ประเภท | รูปแบบ URL |
|---|---|
| ใช้ชื่อ repository | `https://USERNAME.github.io/pea-eform/` |
| ใช้ชื่อ user (ถ้าตั้งชื่อ repo เป็น `USERNAME.github.io`) | `https://USERNAME.github.io/` |

ตัวอย่าง: ถ้า username คือ `pea-south1` และ repo ชื่อ `pea-eform`
→ URL จะเป็น `https://pea-south1.github.io/pea-eform/`

---

## 📋 โครงสร้าง Repository ที่ถูกต้อง

```
pea-eform/                    ← Repository root
│
├── index.html                ← ระบบ e-Form หลัก (สำคัญมาก ต้องชื่อนี้)
├── Code.gs                   ← Google Apps Script
├── README_eForm_PEA.md       ← คู่มือการใช้งาน
└── README.md                 ← สร้างอัตโนมัติตอนสร้าง repo (ไม่ต้องลบ)
```

---

## ⚠️ สิ่งสำคัญที่ต้องรู้

### ✅ ข้อดีของ GitHub Pages
- ฟรี 100% สำหรับ Public Repository
- URL คงที่ ไม่หมดอายุ
- HTTPS อัตโนมัติ (ปลอดภัย)
- อัปเดตไฟล์ได้ตลอดเวลา

### ⚠️ ข้อจำกัด
| รายการ | รายละเอียด |
|---|---|
| ขนาดไฟล์สูงสุด | 1 GB ต่อ repository (ไฟล์เรามีขนาดเล็กกว่ามาก) |
| Public เท่านั้น | ถ้าใช้ GitHub Free ต้อง Public (ทุกคนเข้าได้) |
| ข้อมูลใน localStorage | ข้อมูลที่กรอกในระบบเก็บในเครื่องของผู้ใช้ ไม่ได้อยู่บน GitHub |
| ไม่มี server-side | ระบบนี้เป็น Static HTML ล้วน ไม่ต้องการ server |

### 🔒 ความปลอดภัยของข้อมูล
- ตัวระบบ (HTML) อยู่บน GitHub — **ทุกคนดูโค้ดได้**
- **ข้อมูลที่กรอก** (งานจัดซื้อ) เก็บใน **localStorage ของเบราว์เซอร์ผู้ใช้** — ไม่ได้ส่งขึ้น GitHub
- ถ้าต้องการความปลอดภัยสูงขึ้น ควรใช้ **Private Repository** (ต้องการ GitHub Pro/Team)

---

## 🔄 วิธีอัปเดตไฟล์ในภายหลัง

เมื่อมีการแก้ไขระบบใหม่:

1. ไปที่ Repository บน GitHub
2. คลิกที่ไฟล์ `index.html`
3. กดปุ่มดินสอ ✏️ (Edit)
4. **หรือ** กด **Add file → Upload files** แล้วอัปโหลดไฟล์ใหม่ทับ
5. GitHub Pages จะอัปเดตโดยอัตโนมัติภายใน 1-2 นาที

---

## 🆘 แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|---|---|
| เข้า URL แล้วเจอ 404 | รอ 5-10 นาที หรือตรวจสอบว่าเปิด Pages แล้ว |
| Pages ไม่เปิดใน Settings | Repository ต้องเป็น Public |
| ระบบไม่แสดงผล | ตรวจสอบว่าไฟล์ชื่อ `index.html` (ไม่ใช่ `pea_eform.html`) |
| ฟอนต์ไม่แสดง | ต้องออนไลน์ เพราะฟอนต์โหลดจาก Google Fonts |
| ข้อมูลหาย | ข้อมูลอยู่ใน localStorage ของเครื่องผู้ใช้ ไม่ได้อยู่บน GitHub |

---

## 📱 แชร์ให้ทีมใช้งาน

หลัง Deploy แล้ว สามารถแชร์ URL ให้ทีมงานได้ทันที:

```
ระบบ e-Form จัดซื้อจัดจ้าง กฟภ.
🔗 https://USERNAME.github.io/pea-eform/

วิธีใช้:
1. เปิดลิงก์ในเบราว์เซอร์ Chrome หรือ Edge
2. กรอกข้อมูลในแบบฟอร์มที่ต้องการ
3. กด "ดูตัวอย่าง" เพื่อพรีวิวเอกสาร
4. กด Word หรือ PDF เพื่อบันทึก
```

---

*จัดทำสำหรับระบบ e-Form จัดซื้อจัดจ้าง กฟภ. | การไฟฟ้าส่วนภูมิภาค*
