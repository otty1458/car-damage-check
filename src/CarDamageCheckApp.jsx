import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-500 text-white" {...props}>{children}</button>
);

export default function CarDamageCheckApp() {
  const [selectedCar, setSelectedCar] = useState("1号車");
  const [damageData, setDamageData] = useState(() => {
    const saved = localStorage.getItem("damageRecords");
    return saved ? JSON.parse(saved) : {};
  });
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [popup, setPopup] = useState(null);

  const handleImageClick = async (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const timestamp = new Date().toLocaleString();
    const uploader = "テストユーザー";

    const newEntry = {
      x,
      y,
      note: note || "テストメモ",
      photoUrl: photo || "https://via.placeholder.com/150",
      timestamp,
      uploader,
    };

    const updated = {
      ...damageData,
      [selectedCar]: [...(damageData[selectedCar] || []), newEntry],
    };
    setDamageData(updated);
    localStorage.setItem("damageRecords", JSON.stringify(updated));
    setNote("");
    setPhoto(null);

    notifySlack(newEntry, selectedCar);
    sendToSpreadsheet(newEntry, selectedCar);
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

  const uploadToDrive = async (imageDataUrl) => {
    alert("※実際のGoogle Driveアップロードはサーバーが必要です。");
    return imageDataUrl;
  };

  const notifySlack = (entry, carId) => {
    const message = `📢 ${carId}に傷記録が追加されました\n\n記録者: ${entry.uploader}\n日時: ${entry.timestamp}\nメモ: ${entry.note}`;
    console.log("Slack通知:", message);
  };

  const sendToSpreadsheet = async (entry, carId) => {
    const sheetUrl = "https://script.google.com/macros/s/AKfycbw8aNkm_KKTVBRj92MRawb6OJM_6xAfI69Y8VyFmchlMOmBLC3BZD5OFOq7TJSAw5gGjg/exec";

    try {
      await fetch(sheetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carId,
          x: entry.x,
          y: entry.y,
          note: entry.note,
          photoUrl: entry.photoUrl,
          timestamp: entry.timestamp,
          uploader: entry.uploader,
        }),
      });
      console.log("📋 スプレッドシートに送信成功");
    } catch (error) {
      console.error("❌ スプレッドシート送信エラー", error);
    }
  };

  return (
    <div className="p-4 space-y-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold">車両傷記録アプリ</h1>

      <div className="space-x-2">
        <label>号車選択：</label>
        <select
          value={selectedCar}
          onChange={(e) => setSelectedCar(e.target.value)}
          className="border p-2 rounded"
        >
          {Array.from({ length: 25 }).map((_, i) => (
            <option key={i + 1}>{`${i + 1}号車`}</option>
          ))}
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
            className="absolute w-6 h-6 bg-red-600 text-[10px] rounded-full text-white flex items-center justify-center cursor-pointer"
            style={{
              top: `${entry.y}%`,
              left: `${entry.x}%`,
              transform: "translate(-50%, -50%)",
            }}
            title={`${entry.timestamp} ${entry.uploader}`}
            onClick={() => handleMarkerClick(entry)}
          >
            !
          </div>
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
            <img src={popup.photoUrl} alt="damage" className="w-full mb-2 rounded" />
            <p className="text-sm">📅 {popup.timestamp}</p>
            <p className="text-sm">👤 {popup.uploader}</p>
            <p className="text-sm">📝 {popup.note}</p>
            <button
              onClick={closePopup}
              className="mt-1 text-xs text-blue-500 underline"
            >
              閉じる
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 w-full max-w-lg">
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
