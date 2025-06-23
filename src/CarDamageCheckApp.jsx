import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-500 text-white" {...props}>{children}</button>
);

export default function CarDamageCheckApp() {
  const [selectedCar, setSelectedCar] = useState("A号車");
  const [damageData, setDamageData] = useState(() => {
    const saved = localStorage.getItem("damageRecords");
    return saved ? JSON.parse(saved) : {};
  });
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [popup, setPopup] = useState(null);

  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (!photo) return alert("先に写真を選択してください。");

    const newEntry = {
      x,
      y,
      note,
      photo,
    };

    const updated = {
      ...damageData,
      [selectedCar]: [...(damageData[selectedCar] || []), newEntry],
    };
    setDamageData(updated);
    localStorage.setItem("damageRecords", JSON.stringify(updated));
    setNote("");
    setPhoto(null);
  };

  const handlePhotoUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const exportToPDF = () => {
    const input = document.getElementById("car-area");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save(`${selectedCar}_damage.pdf`);
    });
  };

  const handleMarkerClick = (entry) => {
    setPopup(entry);
  };

  const closePopup = () => setPopup(null);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">車両傷記録アプリ</h1>

      <div className="space-x-2">
        <label>号車選択：</label>
        <select
          value={selectedCar}
          onChange={(e) => setSelectedCar(e.target.value)}
          className="border p-2 rounded"
        >
          <option>A号車</option>
          <option>B号車</option>
          <option>C号車</option>
        </select>
      </div>

      <div id="car-area" className="relative w-full max-w-lg">
        <img
          src="/car-top-view.png"
          alt="car"
          className="w-full border rounded"
          onClick={handleImageClick}
        />
        {(damageData[selectedCar] || []).map((entry, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-red-500 rounded-full cursor-pointer"
            style={{
              top: `${entry.y}%`,
              left: `${entry.x}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => handleMarkerClick(entry)}
            title={entry.note}
          ></div>
        ))}

        {popup && (
          <div
            className="absolute z-10 bg-white border rounded p-2 shadow"
            style={{
              top: `${popup.y}%`,
              left: `${popup.x}%`,
              transform: "translate(-50%, -110%)",
              maxWidth: "200px",
            }}
          >
            <img src={popup.photo} alt="damage" className="w-full mb-2" />
            <p className="text-sm">{popup.note}</p>
            <button
              onClick={closePopup}
              className="mt-1 text-xs text-blue-500 underline"
            >
              閉じる
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e.target.files[0])}
        />
        <textarea
          placeholder="メモを入力"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {photo && (
          <img src={photo} alt="preview" className="w-32 border rounded" />
        )}
      </div>

      <div className="pt-4">
        <Button onClick={exportToPDF}>PDFで保存</Button>
      </div>
    </div>
  );
}
