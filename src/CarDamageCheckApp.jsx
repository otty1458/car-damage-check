import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-500 text-white" {...props}>{children}</button>
);

export default function CarDamageCheckApp() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [formData, setFormData] = useState({
    フロント: { photo: null },
    左側: { photo: null },
    右側: { photo: null },
    リア: { photo: null },
    天井: { photo: null },
    ボンネット: { photo: null }
  });

  const handlePartClick = (part) => {
    setSelectedPart((prev) => (prev === part ? null : part));
  };

  const handlePhotoUpload = (part, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [part]: { photo: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  const exportToPDF = () => {
    const input = document.getElementById("car-diagram");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10);
      pdf.save("damage-map.pdf");
    });
  };

  const exportToPNG = () => {
    const input = document.getElementById("car-diagram");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "damage-map.png";
      link.href = imgData;
      link.click();
    });
  };

  const uploadToGoogleDrive = async () => {
    alert("Google Driveへの保存は未実装です。");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">アルファード展開図 - 傷箇所表示</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div id="car-diagram" className="relative inline-block">
            <img src="/car-top-view.png" alt="car" className="w-full max-w-md" />
            {Object.keys(formData).map((part, i) => (
              <div
                key={part}
                className="absolute border-2 border-transparent active:border-blue-400 cursor-pointer"
                style={{
                  top: `${10 + i * 10}%`,
                  left: `${10 + i * 5}%`,
                  width: "50px",
                  height: "50px",
                  zIndex: 10,
                }}
                onClick={() => handlePartClick(part)}
              >
                {selectedPart === part && formData[part].photo && (
                  <img
                    src={formData[part].photo}
                    alt="傷画像"
                    className="absolute top-0 left-0 w-24 border border-red-500 rounded bg-white shadow-lg"
                    style={{ zIndex: 20 }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 space-x-2">
            <Button onClick={exportToPDF}>PDFで保存</Button>
            <Button onClick={exportToPNG}>PNGで保存</Button>
            <Button onClick={uploadToGoogleDrive}>Google Driveへ保存</Button>
          </div>
        </div>
        {selectedPart && (
          <div className="flex-1 border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">{selectedPart}</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(selectedPart, e.target.files[0])}
              className="mb-2"
            />
            {formData[selectedPart].photo && (
              <img
                src={formData[selectedPart].photo}
                alt="傷画像"
                className="w-full max-w-xs border rounded"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
