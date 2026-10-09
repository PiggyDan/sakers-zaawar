import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  ImagePlus,
  Eraser,
  AlertCircle
} from "lucide-react";
import companyLogo from "./assets/logos/saker.png";
import "./styles.css";

const emptyEmployee = () => ({ name: "", position: "", phone: "" });

const companyOptions = [
  { value: "Сэкер Ресорсус Монголиа ХХК" },
  { value: "Засагчандмань майнз ХХК" },
  { value: "Эрхэт түнш ХХК" },
  { value: "Титантауэр констракшн ХХК" },
  { value: "Грийн энержи ХХК" },
  { value: "Дээдийн говийн жим ХХК" },
  { value: "Хонгор алтайн тал ХХК" },
  { value: "Эйч эйч ай ХХК" },
  { value: "Форчо майнинг ХХК" },
  { value: "Хар ирвэс ХХК" },
  { value: "Бусад ХХК" }
];

const transportOptions = [
  "Байгууллагын унаагаар",
  "Замын унаа",
  "Хувийн унаа",
  "АТҮТ / Нийтийн тээвэр",
  "Гэрээт компаний унаа",
  "Бусад"
];

const PUBLIC_TRANSPORT = "АТҮТ / Нийтийн тээвэр";

const steps = [
  { title: "Аяллын мэдээлэл", hint: "Компани, хэлтэс, өдөр, чиглэл" },
  { title: "Тээврийн хэрэгсэл", hint: "Ямар унаагаар зорчих вэ?" },
  { title: "Зорчих ажилтан", hint: "Хамгийн ихдээ 4 ажилтан бүртгэнэ" },
  { title: "Баталгаажуулах", hint: "Зааварчилгаатай танилцаж гарын үсэг зурна" }
];

const emptyForm = () => ({
  company: companyOptions[0].value,
  department: "",
  travelDate: "",
  direction: "",
  otherDirection: "",
  transport: transportOptions[0],
  driver: "",
  driverPhone: "",
  vehicle: "",
  vehiclePlate: ""
});

const SIGNATURE_MAX_EDGE = 900;

/**
 * Reads a signature image and scales it down, so a phone photo does not
 * exceed the request body limit once base64-encoded.
 */
function readScaledImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const dataUrl = reader.result;
      const image = new Image();

      image.onerror = () => reject(new Error("decode failed"));
      image.onload = () => {
        const scale = Math.min(
          1,
          SIGNATURE_MAX_EDGE / Math.max(image.width, image.height)
        );

        if (scale === 1 && dataUrl.length < 700_000) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };

      image.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/** Per-step checks; each returns the labels of the fields still missing. */
function missingFor(step, form, employees, signature, accepted) {
  const missing = [];

  if (step === 0) {
    if (!form.department.trim()) missing.push("Харьяалагдах хэлтэс");
    if (!form.travelDate) missing.push("Аялах өдөр");
    if (!form.direction) missing.push("Аялах чиглэл");
    if (form.direction === "Бусад" && !form.otherDirection.trim()) missing.push("Бусад явах чиглэл");
  }

  if (step === 1) {
    if (!form.transport.trim()) missing.push("Аялах тээврийн хэрэгсэл");
    if (form.transport !== PUBLIC_TRANSPORT) {
      if (!form.driver.trim()) missing.push("Жолоочийн нэр");
      if (!/^[0-9]+$/.test(form.driverPhone)) missing.push("Жолоочийн утасны дугаар");
      if (!form.vehicle.trim()) missing.push("Автомашины марк");
      if (!/^[0-9]{4} [А-ЯӨҮЁ]{3}$/.test(form.vehiclePlate.trim())) missing.push("Улсын дугаар (9911 УБА)");
    }
  }

  if (step === 2) {
    employees.forEach((employee, index) => {
      if (!employee.name.trim()) missing.push(`Ажилтан ${index + 1} - Овог нэр`);
      if (!employee.position.trim()) missing.push(`Ажилтан ${index + 1} - Албан тушаал`);
      if (!employee.phone.trim()) missing.push(`Ажилтан ${index + 1} - Утасны дугаар`);
    });
  }

  if (step === 3) {
    if (!signature) missing.push("Гарын үсэг");
    if (!accepted) missing.push("Танилцсан нөхцөл");
  }

  return missing;
}

function AppBar({ step, onBack }) {
  return (
    <header className="appBar">
      <div className="appBarRow">
        {onBack ? (
          <button type="button" className="backBtn" onClick={onBack} aria-label="Буцах">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <img src={companyLogo} alt="" className="appBarLogo" draggable="false" />
        )}
        <div className="appBarText">
          <strong>Сэкер Ресорсус Монголиа</strong>
          <span>Аяллын аюулгүй ажиллагаа</span>
        </div>
        {step !== undefined && (
          <span className="stepCount">
            {step + 1}/{steps.length}
          </span>
        )}
      </div>
      {step !== undefined && (
        <div className="progress" aria-hidden="true">
          {steps.map((_, index) => (
            <span key={index} className={index <= step ? "progressOn" : ""} />
          ))}
        </div>
      )}
    </header>
  );
}

/** Finger/mouse signature pad, with a photo upload as an alternative. */
function SignaturePad({ value, onChange, onError }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    if (uploaded) return;

    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";

    // Coming back to this step remounts the canvas; repaint the saved strokes.
    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, width, height);
      image.src = value;
    }
    // Only on mount / mode switch; value updates come from this canvas itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaded]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const start = (e) => {
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true;
    const [x, y] = point(e);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.01, y + 0.01);
    context.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    const context = canvasRef.current.getContext("2d");
    const [x, y] = point(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;

    // Flatten onto white so the strokes stay visible in every mail client.
    const canvas = canvasRef.current;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const context = out.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, out.width, out.height);
    context.drawImage(canvas, 0, 0);
    onChange(out.toDataURL("image/png"));
  };

  const clear = () => {
    onChange("");
    if (uploaded) {
      setUploaded(false);
      return;
    }
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      onChange(await readScaledImage(file));
      setUploaded(true);
    } catch {
      onError("Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.");
    }
  };

  return (
    <div className="signaturePad">
      <div className="signatureHeader">
        <span>Гарын үсэг *</span>
        {value && (
          <button type="button" className="ghostBtn" onClick={clear}>
            <Eraser size={15} /> Арилгах
          </button>
        )}
      </div>

      {uploaded && value ? (
        <div className="signatureCanvasWrap">
          <img className="signaturePreview" src={value} alt="Гарын үсэг" />
        </div>
      ) : (
        <div className="signatureCanvasWrap">
          <canvas
            ref={canvasRef}
            className="signatureCanvas"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            aria-label="Гарын үсэг зурах талбар"
          />
          {!value && <span className="signatureHint">Энд хуруугаараа гарын үсэг зурна уу</span>}
          <span className="signatureLine" aria-hidden="true" />
        </div>
      )}

      <label className="uploadSignature">
        <input type="file" accept="image/*" onChange={upload} />
        <ImagePlus size={16} />
        <span>Эсвэл зураг оруулах</span>
      </label>
    </div>
  );
}

function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [employees, setEmployees] = useState([emptyEmployee()]);
  const [showSafety, setShowSafety] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");

  const isPublicTransport = form.transport === PUBLIC_TRANSPORT;
  const lastStep = steps.length - 1;

  // Each step is a history entry, so the phone's back gesture steps back
  // through the form instead of leaving the page.
  useEffect(() => {
    const onPop = (e) => setStep(e.state?.step ?? 0);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setToast("");
  }, [step, submitted]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateForm = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const updateEmployee = (index, key, value) => {
    const next = [...employees];
    next[index] = { ...next[index], [key]: value };
    setEmployees(next);
  };

  const addEmployee = () => {
    if (employees.length < 4) {
      setEmployees([...employees, emptyEmployee()]);
    }
  };

  const removeEmployee = (index) => {
    if (employees.length === 1) return;
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const goNext = () => {
    const missing = missingFor(step, form, employees, signature, accepted);
    if (missing.length > 0) {
      setToast(`Дутуу байна: ${missing[0]}`);
      return;
    }
    window.history.pushState({ step: step + 1 }, "");
    setStep(step + 1);
  };

  const goBack = () => window.history.back();

  const send = async () => {
    if (sending) return;

    for (let index = 0; index <= lastStep; index++) {
      const missing = missingFor(index, form, employees, signature, accepted);
      if (missing.length > 0) {
        setToast(`Дутуу байна: ${missing[0]}`);
        return;
      }
    }

    setSending(true);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          form: {
            ...form,
            driver: isPublicTransport ? "" : form.driver,
            driverPhone: isPublicTransport ? "" : form.driverPhone,
            vehicle: isPublicTransport ? "" : `${form.vehicle.trim()}, ${form.vehiclePlate.trim()}`,
            vehiclePlate: isPublicTransport ? "" : form.vehiclePlate
          },
          employees,
          signature
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to send the form.");
      }

      // Unwind the step entries so back from the success screen leaves cleanly.
      if (step > 0) window.history.go(-step);
      setSubmitted(true);
    } catch (error) {
      setToast(error.message || "Илгээхэд асуудал гарлаа. Та дахин оролдоно уу.");
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    setForm(emptyForm());
    setEmployees([emptyEmployee()]);
    setSignature("");
    setAccepted(false);
    setShowSafety(false);
    setStep(0);
    setSubmitted(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (step < lastStep) goNext();
    else send();
  };

  if (submitted) {
    return (
      <div className="app">
        <AppBar />
        <main className="screen doneScreen">
          <div className="doneIcon">
            <CheckCircle2 size={56} strokeWidth={2.2} />
          </div>
          <h2>Амжилттай илгээгдлээ</h2>
          <p>Аяллын мэдээлэл бүртгэгдлээ. Аюулгүй аялаарай!</p>
          <button type="button" className="primaryBtn" onClick={startOver}>
            Шинэ маягт бөглөх
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <AppBar step={step} onBack={step > 0 ? goBack : undefined} />

      <form onSubmit={onSubmit} noValidate>
        <main className="screen" key={step}>
          {step === 0 && (
            <div className="hero">
              <span>СЭКЕР РЕСОРСУС МОНГОЛИА ХХК · Хувилбар 01</span>
              <h1>АТҮТ болон замын унаагаар зорчих үеийн аюулгүй ажиллагааны зааварчилгаа</h1>
            </div>
          )}

          <div className="stepHead">
            <h2>{steps[step].title}</h2>
            <p>{steps[step].hint}</p>
          </div>

          {step === 0 && (
            <div className="card">
              <Field label="Компани">
                <select name="company" value={form.company} onChange={updateForm}>
                  {companyOptions.map((company) => (
                    <option key={company.value} value={company.value}>
                      {company.value}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Харьяалагдах хэлтэс *">
                <select name="department" value={form.department} onChange={updateForm}>
                  <option value="">Сонгох</option>
                  <option value="Захиргаа">Орон нутагтай харилцах алба</option>
                  <option value="Хүний нөөц">Геологи, Уул уурхайн хэлтэс</option>
                  <option value="ХАБЭАБО">Авто замын хэлтэс</option>
                  <option value="Уулын хэлтэс">ХАБЭА, БО-ны хэлтэс</option>
                  <option value="Тэсэлгээний хэлтэс">Санхүү, Хөрөнгө оруулалт, Борлуулалтын хэлтэс</option>
                  <option value="Удирдлага">Захиргаа, Хүний нөөц хэлтэс</option>
                  <option value="Санхүү">Хуулийн хэлтэс</option>
                  <option value="Хууль">Удирдлага</option>
                  <option value="IT">IT</option>
                  <option value="Бусад">Бусад</option>
                </select>
              </Field>

              <Field label="Аялах өдөр *">
                <input type="date" name="travelDate" value={form.travelDate} onChange={updateForm} />
              </Field>

              <Field label="Аялах чиглэл *">
                <select name="direction" value={form.direction} onChange={updateForm}>
                  <option value="">Сонгох</option>
                  <option>Улаанбаатар-Сайншанд</option>
                  <option>Улаанбаатар-Чандмань уул төмрийн хүдрийн уурхай</option>
                  <option>Улаанбаатар-Дэлгэрэх сум</option>
                  <option>Улаанбаатар-Гурвантэс</option>
                  <option>Сайншанд-Чандмань уул төмрийн хүдрийн уурхай</option>
                  <option>Сайншанд-Дэлгэрэх сум</option>
                  <option>Сайншанд-Улаанбаатар</option>
                  <option>Сайншанд-Гурвантэс</option>
                  <option>Гурвантэс-Улаанбаатар</option>
                  <option>Гурвантэс-Сайншанд</option>
                  <option>Чандмань уул төмрийн уурхай-Улаанбаатар</option>
                  <option>Чандмань уул төмрийн уурхай-Сайншанд</option>
                  <option>Чандмань уул төмрийн уурхай-Чойр</option>
                  <option>Чандмань уул төмрийн уурхай-Гурвантэс</option>
                  <option>Бусад</option>
                </select>
              </Field>

              {form.direction === "Бусад" && (
                <Field label="Бусад явах чиглэл *">
                  <input
                    name="otherDirection"
                    value={form.otherDirection}
                    onChange={updateForm}
                    placeholder="Жишээ: Гурвантэс - Даланзадгад"
                  />
                </Field>
              )}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="chips" role="radiogroup" aria-label="Аялах тээврийн хэрэгсэл">
                {transportOptions.map((option) => (
                  <label key={option} className={`chip${form.transport === option ? " chipOn" : ""}`}>
                    <input
                      type="radio"
                      name="transport"
                      value={option}
                      checked={form.transport === option}
                      onChange={updateForm}
                    />
                    {option}
                  </label>
                ))}
              </div>

              {!isPublicTransport && (
                <div className="card">
                  <Field label="Жолоочийн нэр *">
                    <input
                      name="driver"
                      value={form.driver}
                      onChange={updateForm}
                      placeholder="Жишээ: Бат"
                    />
                  </Field>
                  <Field label="Жолоочийн утасны дугаар *">
                    <input
                      name="driverPhone"
                      type="tel"
                      inputMode="numeric"
                      value={form.driverPhone}
                      onChange={(e) => setForm({ ...form, driverPhone: e.target.value.replace(/[^0-9]/g, "") })}
                      placeholder="Жишээ: 99112233"
                    />
                  </Field>
                  <Field label="Автомашины марк *">
                    <input
                      name="vehicle"
                      value={form.vehicle}
                      onChange={updateForm}
                      placeholder="Жишээ: Lexus LX700"
                    />
                  </Field>
                  <Field label="Улсын дугаар *">
                    <div className="vehiclePlate">
                      <span className="plateCountry" aria-hidden="true">MNG</span>
                      <input
                        aria-label="Улсын дугаар"
                        name="vehiclePlate"
                        value={form.vehiclePlate}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[\s-]/g, "");
                          setForm({ ...form, vehiclePlate: value.length > 4 ? `${value.slice(0, 4)} ${value.slice(4)}` : value });
                        }}
                        maxLength={8}
                        placeholder="9911 УБА"
                        title="4 орон тоо, 3 кирилл үсэг оруулна уу. Жишээ: 9911 УБА"
                      />
                    </div>
                  </Field>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {employees.map((employee, index) => (
                <div className="card" key={index}>
                  <div className="cardHead">
                    <span className="avatar">{index + 1}</span>
                    <strong>Ажилтан {index + 1}</strong>
                    {employees.length > 1 && (
                      <button
                        type="button"
                        className="iconBtn danger"
                        onClick={() => removeEmployee(index)}
                        aria-label="Устгах"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <Field label="Овог нэр *">
                    <input
                      name="employee-name"
                      value={employee.name}
                      onChange={(e) => updateEmployee(index, "name", e.target.value)}
                      placeholder="Овог нэр"
                    />
                  </Field>
                  <Field label="Албан тушаал *">
                    <input
                      name="employee-position"
                      value={employee.position}
                      onChange={(e) => updateEmployee(index, "position", e.target.value)}
                      placeholder="Албан тушаал"
                    />
                  </Field>
                  <Field label="Утасны дугаар *">
                    <input
                      name="employee-phone"
                      type="tel"
                      inputMode="numeric"
                      value={employee.phone}
                      onChange={(e) => updateEmployee(index, "phone", e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="Утас"
                    />
                  </Field>
                </div>
              ))}

              {employees.length < 4 && (
                <button type="button" className="addBtn" onClick={addEmployee}>
                  <Plus size={18} /> Ажилтан нэмэх
                </button>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                className="safetyToggle"
                onClick={() => setShowSafety(!showSafety)}
                aria-expanded={showSafety}
              >
                <span>
                  <strong>Зааварчилгаа унших</strong>
                  <small>Хувийн аюулгүй байдал, аяллын аюулгүй байдал, хүнсний эрүүл ахуй</small>
                </span>
                {showSafety ? <ChevronUp /> : <ChevronDown />}
              </button>

              {showSafety && (
                <div className="safety">
                  <SafetyBlock title="Хувь хүний аюулгүй байдал">
                    <li>Аялалд гарахын өмнө өөрийн эд зүйлсээ шалгах.</li>
                    <li>Эрүүл мэнд, биеийн байдалдаа анхаарах.</li>
                    <li>Шаардлагатай эм, хувийн хэрэгслээ биедээ авч явах.</li>
                    <li>Цаг агаар, нөхцөлдөө тохируулан хувцаслах.</li>
                    <li>Аяллын турш согтууруулах ундаа, сэтгэцэд нөлөөлөх бодис хэрэглэхгүй байх.</li>
                  </SafetyBlock>

                  <SafetyBlock title="Аяллын аюулгүй байдал">
                    <li>Тээврийн хэрэгслийн бүрэн бүтэн байдлыг шалгах.</li>
                    <li>Суудлын бүсийг тогтмол хэрэглэх.</li>
                    <li>Жолоочийн анхаарлыг сарниулахгүй байх.</li>
                    <li>Тээврийн хэрэгсэл бүрэн зогссоны дараа буух.</li>
                    <li>Аяллын замд зөвшөөрөлгүй бууж үлдэхгүй байх.</li>
                    <li>Жолооч хэт ядарсан бол хөдөлгөөнийг зогсоож, ахлах ажилтанд мэдэгдэх.</li>
                  </SafetyBlock>

                  <SafetyBlock title="Хүнсний эрүүл ахуй">
                    <li>Хүнсний бүтээгдэхүүний чанар, хугацааг шалгах.</li>
                    <li>Өөрийн эрүүл мэндэд тохирохгүй хүнс хэрэглэхгүй байх.</li>
                    <li>Замд хэрэглэх хүнс, усыг урьдчилан бэлтгэх.</li>
                  </SafetyBlock>

                  <div className="emergency">
                    <strong>Яаралтай үед холбоо барих</strong>
                    <a href="tel:105">Онцгой байдал: 105</a>
                    <a href="tel:102">Цагдаа: 102</a>
                    <a href="tel:103">Эмнэлэг: 103</a>
                    <a href="tel:75053443">Байгууллага: 75053443</a>
                  </div>
                </div>
              )}

              <div className="card">
                <SignaturePad value={signature} onChange={setSignature} onError={setToast} />
              </div>

              <label className="accept">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  Дээрх шаардлагыг бүрэн уншиж танилцсан, ойлгосон бөгөөд мөрдөхөө зөвшөөрч байна.
                </span>
              </label>
            </>
          )}
        </main>

        <footer className="actionBar">
          {step > 0 && (
            <button type="button" className="secondaryBtn" onClick={goBack} aria-label="Буцах">
              <ChevronLeft size={22} />
            </button>
          )}
          <button className="primaryBtn" type="submit" disabled={sending}>
            {step < lastStep ? (
              <>
                Үргэлжлүүлэх <ChevronRight size={20} />
              </>
            ) : sending ? (
              <>
                <span className="spinner" aria-hidden="true" /> Илгээж байна...
              </>
            ) : (
              "Илгээх"
            )}
          </button>
        </footer>
      </form>

      {toast && (
        <div className="toast" role="alert" onClick={() => setToast("")}>
          <AlertCircle size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SafetyBlock({ title, children }) {
  return (
    <div className="safetyBlock">
      <h3>{title}</h3>
      <ol>{children}</ol>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
