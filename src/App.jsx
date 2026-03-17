import { useEffect, useMemo, useState } from "react";

export default function App() {
  const initialMachines = [
    { name: "SV-1165", line: "Line A", status: "運轉中", output: 125, util: 86 },
    { name: "SV-110S", line: "Line A", status: "待機", output: 98, util: 74 },
    { name: "NV-10", line: "Line A", status: "異常停機", output: 87, util: 61 },
    { name: "SV-76S", line: "Line B", status: "異常停機", output: 72, util: 58 },
    { name: "NV-8", line: "Line B", status: "運轉中", output: 90, util: 81 },
  ];

  const machineAlarmDetails = {
    "SV-1165": [
      { time: "14:08", code: "SYS-001", reason: "加工節拍穩定", status: "正常" },
      { time: "13:42", code: "TEMP-OK", reason: "主軸溫度正常", status: "正常" },
    ],
    "SV-110S": [
      { time: "09:15", code: "MT-002", reason: "待料停機", status: "待處理" },
      { time: "08:48", code: "JOB-011", reason: "工單切換等待", status: "進行中" },
    ],
    "NV-10": [
      { time: "10:40", code: "AL-014", reason: "刀庫定位異常", status: "待處理" },
      { time: "10:52", code: "CHK-002", reason: "需檢查換刀機構", status: "進行中" },
    ],
    "SV-76S": [
      { time: "11:25", code: "AL-021", reason: "主軸異常警報", status: "待處理" },
      { time: "11:42", code: "RST-001", reason: "嘗試復歸重啟", status: "進行中" },
      { time: "11:58", code: "MT-009", reason: "待料同步確認", status: "待確認" },
    ],
    "NV-8": [
      { time: "13:15", code: "SYS-002", reason: "設備連線正常", status: "正常" },
      { time: "13:40", code: "OUT-001", reason: "產量穩定提升", status: "正常" },
    ],
  };

  const suggestions = [
    "目前稼動率最低的是哪一台？",
    "今天哪台機台產量最高？",
    "有哪些設備發生異常停機？",
    "Line A 與 Line B 產量差多少？",
  ];

  const alarms = [
    { time: "11:25", machine: "SV-76S", code: "AL-021", msg: "主軸異常警報" },
    { time: "10:40", machine: "NV-10", code: "AL-014", msg: "刀庫定位異常" },
    { time: "09:15", machine: "SV-110S", code: "MT-002", msg: "待料停機" },
  ];

  const [machines, setMachines] = useState(initialMachines);
  const [now, setNow] = useState(new Date());
  const [selectedMachineName, setSelectedMachineName] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("目前稼動率最低的是哪一台？");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1400);

  useEffect(() => {
    const resizeHandler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const dataTimer = setInterval(() => {
      setMachines((prev) =>
        prev.map((machine) => {
          let newOutput = machine.output;
          let newUtil = machine.util;
          let newStatus = machine.status;

          if (machine.status === "運轉中") {
            newOutput += Math.floor(Math.random() * 3);
            newUtil = Math.min(95, Math.max(70, machine.util + (Math.random() > 0.5 ? 1 : -1)));
          }

          if (machine.status === "待機") {
            newUtil = Math.min(80, Math.max(60, machine.util + (Math.random() > 0.5 ? 1 : -1)));
          }

          if (machine.status === "異常停機") {
            newUtil = Math.min(65, Math.max(45, machine.util + (Math.random() > 0.5 ? 1 : -1)));
          }

          const roll = Math.random();

          if (machine.name === "SV-110S" && roll > 0.93) {
            newStatus = machine.status === "待機" ? "運轉中" : "待機";
          }
          if (machine.name === "NV-10" && roll > 0.96) {
            newStatus = machine.status === "異常停機" ? "待機" : "異常停機";
          }
          if (machine.name === "SV-76S" && roll > 0.97) {
            newStatus = machine.status === "異常停機" ? "待機" : "異常停機";
          }

          return {
            ...machine,
            output: newOutput,
            util: newUtil,
            status: newStatus,
          };
        })
      );
    }, 3000);

    return () => clearInterval(dataTimer);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1100;

  const selectedMachine = useMemo(() => {
    if (!selectedMachineName) return null;
    return machines.find((m) => m.name === selectedMachineName) || null;
  }, [machines, selectedMachineName]);

  const selectedMachineIndex = useMemo(() => {
    if (!selectedMachine) return -1;
    return machines.findIndex((m) => m.name === selectedMachine.name);
  }, [machines, selectedMachine]);

  const prevMachine = selectedMachineIndex > 0 ? machines[selectedMachineIndex - 1] : null;
  const nextMachine =
    selectedMachineIndex >= 0 && selectedMachineIndex < machines.length - 1
      ? machines[selectedMachineIndex + 1]
      : null;

  const totalOutput = useMemo(() => machines.reduce((sum, m) => sum + m.output, 0), [machines]);

  const avgUtil = useMemo(() => {
    const total = machines.reduce((sum, m) => sum + m.util, 0);
    return (total / machines.length).toFixed(1);
  }, [machines]);

  const abnormalMachines = useMemo(() => machines.filter((m) => m.status === "異常停機"), [machines]);
  const abnormalCount = abnormalMachines.length;
  const idleCount = machines.filter((m) => m.status === "待機").length;
  const runningCount = machines.filter((m) => m.status === "運轉中").length;

  const lowestUtilMachine = useMemo(() => [...machines].sort((a, b) => a.util - b.util)[0], [machines]);
  const topOutputMachine = useMemo(() => [...machines].sort((a, b) => b.output - a.output)[0], [machines]);
  const topOutputMachines = useMemo(() => [...machines].sort((a, b) => b.output - a.output).slice(0, 4), [machines]);

  const lineAOutput = useMemo(
    () => machines.filter((m) => m.line === "Line A").reduce((sum, m) => sum + m.output, 0),
    [machines]
  );
  const lineBOutput = useMemo(
    () => machines.filter((m) => m.line === "Line B").reduce((sum, m) => sum + m.output, 0),
    [machines]
  );

  const outputDiff = Math.abs(lineAOutput - lineBOutput);
  const higherLine = lineAOutput >= lineBOutput ? "Line A" : "Line B";

  const selectedMachineDetail = useMemo(() => {
    if (!selectedMachine) return null;

    const reasons = {
      "運轉中": "正常加工中，節拍穩定",
      "待機": "待料 / 排程等待",
      "異常停機": "警報或加工中斷待處理",
    };

    const actions = {
      "運轉中": "持續監控節拍與刀具壽命",
      "待機": "確認待料原因與工單排程",
      "異常停機": "優先檢查警報碼、機構與程式設定",
    };

    return {
      reason: reasons[selectedMachine.status],
      action: actions[selectedMachine.status],
      estimatedDowntime:
        selectedMachine.status === "異常停機"
          ? "2 小時 10 分"
          : selectedMachine.status === "待機"
          ? "35 分"
          : "0 分",
      alarmHistory: machineAlarmDetails[selectedMachine.name] || [],
    };
  }, [selectedMachine]);

  const getStatusColor = (status) => {
    if (status === "運轉中") return "#22c55e";
    if (status === "待機") return "#f59e0b";
    if (status === "異常停機") return "#ef4444";
    return "#64748b";
  };

  const getBarColor = (value) => {
    if (value >= 80) return "#22c55e";
    if (value >= 65) return "#f59e0b";
    return "#ef4444";
  };

  const getAlarmStatusColor = (status) => {
    if (status === "正常") return "#22c55e";
    if (status === "進行中") return "#f59e0b";
    if (status === "待處理") return "#ef4444";
    if (status === "待確認") return "#38bdf8";
    return "#94a3b8";
  };

  const formatDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
  };

  const sectionTitleStyle = {
    marginTop: 0,
    marginBottom: "8px",
    color: "white",
    fontSize: isMobile ? "22px" : "26px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  };

  const cardStyle = {
    background: "#0f1b2d",
    borderRadius: "18px",
    padding: isMobile ? "16px" : "24px",
    border: "1px solid #1f2f46",
  };

  const buildAiAnswer = (questionRaw) => {
    const question = questionRaw.trim();
    const q = question.toUpperCase();

    if (!question) {
      return "請輸入想查詢的問題，例如：哪台稼動率最低、NV-10 狀態、Line A 產量。";
    }

    if (q.includes("最低") && (q.includes("稼動") || q.includes("OEE"))) {
      return `目前稼動率最低設備為 ${lowestUtilMachine.name}，當前稼動率為 ${lowestUtilMachine.util}%，狀態為 ${lowestUtilMachine.status}。`;
    }

    if ((q.includes("最高") && q.includes("產量")) || q.includes("產量最高")) {
      return `目前產量最高設備為 ${topOutputMachine.name}，今日累計產量為 ${topOutputMachine.output} 件，所在線別為 ${topOutputMachine.line}。`;
    }

    if (q.includes("異常") || q.includes("停機")) {
      if (abnormalMachines.length === 0) {
        return "目前沒有設備處於異常停機狀態。";
      }
      return `目前異常停機設備共有 ${abnormalMachines.length} 台，分別為：${abnormalMachines.map((m) => m.name).join("、")}。`;
    }

    if ((q.includes("LINE A") || q.includes("LINEA")) && q.includes("產量")) {
      return `Line A 目前累計產量為 ${lineAOutput} 件。`;
    }

    if ((q.includes("LINE B") || q.includes("LINEB")) && q.includes("產量")) {
      return `Line B 目前累計產量為 ${lineBOutput} 件。`;
    }

    if ((q.includes("LINE A") || q.includes("LINEA") || q.includes("LINE B") || q.includes("LINEB")) && (q.includes("差") || q.includes("比較"))) {
      return `目前 ${higherLine} 產量較高。Line A 為 ${lineAOutput} 件，Line B 為 ${lineBOutput} 件，差距為 ${outputDiff} 件。`;
    }

    const matchedMachine = machines.find((m) => q.includes(m.name.toUpperCase()));
    if (matchedMachine) {
      const alarmHistory = machineAlarmDetails[matchedMachine.name] || [];
      const latestAlarm = alarmHistory[0];

      if (q.includes("狀態")) {
        return `${matchedMachine.name} 目前狀態為 ${matchedMachine.status}，稼動率 ${matchedMachine.util}%，今日產量 ${matchedMachine.output} 件。`;
      }

      if (q.includes("產量")) {
        return `${matchedMachine.name} 今日產量為 ${matchedMachine.output} 件。`;
      }

      if (q.includes("稼動") || q.includes("OEE")) {
        return `${matchedMachine.name} 目前稼動率為 ${matchedMachine.util}%。`;
      }

      if (q.includes("警報") || q.includes("原因")) {
        if (!latestAlarm) {
          return `${matchedMachine.name} 目前沒有警報紀錄。`;
        }
        return `${matchedMachine.name} 最近警報時間為 ${latestAlarm.time}，警報代碼 ${latestAlarm.code}，原因為「${latestAlarm.reason}」，目前狀態為 ${latestAlarm.status}。`;
      }

      return `${matchedMachine.name} 目前狀態為 ${matchedMachine.status}，稼動率 ${matchedMachine.util}%，今日產量 ${matchedMachine.output} 件。`;
    }

    return "目前這版 AI 助理支援：稼動率最低、產量最高、異常停機、Line A/Line B 產量比較，以及指定機台的狀態、產量、稼動率與警報查詢。";
  };

  useEffect(() => {
    setCurrentAnswer(buildAiAnswer(currentQuestion));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines]);

  const handleAiSubmit = (text) => {
    const content = text.trim();
    if (!content) return;
    setCurrentQuestion(content);
    setCurrentAnswer(buildAiAnswer(content));
    setAiInput("");
  };

  const openMachineDetail = (name) => {
    setSelectedMachineName(name);
    setSearchInput(name);
    setIsDetailOpen(true);
  };

  const closeMachineDetail = () => {
    setIsDetailOpen(false);
  };

  const handleSearch = () => {
    const keyword = searchInput.trim().toUpperCase();
    if (!keyword) return;
    const found = machines.find((m) => m.name.toUpperCase() === keyword);
    if (found) {
      setSelectedMachineName(found.name);
    }
  };

  const goPrevMachine = () => {
    if (prevMachine) {
      setSelectedMachineName(prevMachine.name);
      setSearchInput(prevMachine.name);
    }
  };

  const goNextMachine = () => {
    if (nextMachine) {
      setSelectedMachineName(nextMachine.name);
      setSearchInput(nextMachine.name);
    }
  };

  const MachineTile = ({ machine }) => (
    <button
      onClick={() => openMachineDetail(machine.name)}
      style={{
        background: "linear-gradient(180deg, #1a2b41 0%, #142338 100%)",
        borderRadius: "18px",
        border: `1px solid ${getStatusColor(machine.status)}`,
        minHeight: isMobile ? "220px" : "260px",
        padding: isMobile ? "14px" : "16px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div>
        <div
          style={{
            color: "white",
            fontSize: isMobile ? "26px" : "30px",
            fontWeight: 700,
            lineHeight: 1.1,
            wordBreak: "break-word",
          }}
        >
          {machine.name}
        </div>

        <div
          style={{
            color: "#93c5fd",
            fontSize: "14px",
            marginTop: "6px",
          }}
        >
          {machine.line}
        </div>
      </div>

      <div
        style={{
          marginTop: "14px",
          display: "inline-flex",
          alignSelf: "flex-start",
          background: getStatusColor(machine.status),
          color: "white",
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {machine.status}
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <div
          style={{
            background: "#0b1220",
            borderRadius: "12px",
            padding: "12px",
            border: "1px solid #24354e",
          }}
        >
          <div style={{ color: "#cbd5e1", fontSize: "12px", marginBottom: "6px" }}>
            今日產量
          </div>
          <div style={{ color: "white", fontSize: isMobile ? "20px" : "22px", fontWeight: 700, lineHeight: 1.1 }}>
            {machine.output}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>件</div>
        </div>

        <div
          style={{
            background: "#0b1220",
            borderRadius: "12px",
            padding: "12px",
            border: "1px solid #24354e",
          }}
        >
          <div style={{ color: "#cbd5e1", fontSize: "12px", marginBottom: "6px" }}>
            稼動率
          </div>
          <div style={{ color: "white", fontSize: isMobile ? "20px" : "22px", fontWeight: 700, lineHeight: 1.1 }}>
            {machine.util}%
          </div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>OEE</div>
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "#cbd5e1", fontSize: "12px" }}>運行指標</span>
          <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>
            {machine.util}%
          </span>
        </div>

        <div
          style={{
            background: "#09111d",
            height: "10px",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${machine.util}%`,
              height: "100%",
              background: getBarColor(machine.util),
              borderRadius: "999px",
            }}
          />
        </div>
      </div>
    </button>
  );

  const kpis = [
    { label: "今日稼動率", value: `${avgUtil}%`, sub: "即時模擬更新中" },
    { label: "今日總產量", value: `${totalOutput} 件`, sub: lineAOutput >= lineBOutput ? "Line A 表現最佳" : "Line B 表現最佳" },
    { label: "停機設備數", value: `${abnormalCount} 台`, sub: `${lowestUtilMachine.name} 稼動率最低` },
    { label: "待機設備數", value: `${idleCount} 台`, sub: `在線設備 ${runningCount} 台` },
  ];

  return (
    <>
      <div
        style={{
          background: "linear-gradient(180deg, #06101f 0%, #081224 100%)",
          color: "white",
          minHeight: "100vh",
          padding: isMobile ? "14px" : "28px",
          fontFamily: "Arial, Microsoft JhengHei, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1520px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? "14px" : "0",
              marginBottom: "24px",
              padding: isMobile ? "16px" : "20px 24px",
              background: "#0b1628",
              borderRadius: "18px",
              border: "1px solid #1e293b",
            }}
          >
            <div style={{ width: "100%" }}>
              <h1
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: isMobile ? "30px" : "38px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  lineHeight: 1.15,
                }}
              >
                SHINZAWA Smart Factory
              </h1>
              <div style={{ marginTop: "8px", color: "#cbd5e1", fontSize: isMobile ? "13px" : "15px" }}>
                震澤智慧工廠系統｜AI 半對話展示版
              </div>
            </div>

            <div style={{ textAlign: isMobile ? "left" : "right", width: isMobile ? "100%" : "auto" }}>
              <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "4px" }}>系統時間</div>
              <div style={{ color: "white", fontSize: isMobile ? "18px" : "20px", fontWeight: "700" }}>
                {formatDateTime(now)}
              </div>
              <div style={{ color: "#38bdf8", fontSize: "13px", marginTop: "4px" }}>
                Demo / AI Semi-Chat 模式
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {kpis.map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#122033",
                  borderRadius: "16px",
                  padding: isMobile ? "16px" : "20px",
                  border: "1px solid #1f2f46",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "10px" }}>{item.label}</div>
                <div
                  style={{
                    fontSize: isMobile ? "30px" : "34px",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "white",
                  }}
                >
                  {item.value}
                </div>
                <div style={{ color: "#38bdf8", fontSize: "14px" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.9fr 1fr",
              gap: "24px",
            }}
          >
            <div style={{ display: "grid", gap: "24px" }}>
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>3D / 平面產線監控</h2>
                <p style={{ color: "#cbd5e1", marginTop: 0, marginBottom: "18px", fontSize: "15px" }}>
                  點擊任一機台卡片後，會彈出詳細資訊視窗，顯示警報明細與處理狀態。
                </p>

                <div
                  style={{
                    background: "linear-gradient(180deg, #091321 0%, #0b1422 100%)",
                    borderRadius: "20px",
                    padding: isMobile ? "14px" : "24px",
                    border: "1px solid #223550",
                    minHeight: isMobile ? "auto" : "560px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "linear-gradient(rgba(51,65,85,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.18) 1px, transparent 1px)",
                      backgroundSize: "36px 36px",
                      opacity: 0.5,
                    }}
                  />

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: "8px",
                        marginBottom: "18px",
                      }}
                    >
                      <div style={{ color: "white", fontSize: isMobile ? "20px" : "22px", fontWeight: 700 }}>
                        Factory Layout
                      </div>
                      <div style={{ color: "#93c5fd", fontSize: "14px" }}>SHINZAWA Demo Plant</div>
                    </div>

                    <div
                      style={{
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.22)",
                        borderRadius: "18px",
                        padding: isMobile ? "14px" : "18px",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          color: "white",
                          fontSize: isMobile ? "18px" : "20px",
                          fontWeight: 700,
                          marginBottom: "12px",
                          textAlign: "center",
                        }}
                      >
                        Line A
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, minmax(220px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        {machines.filter((m) => m.line === "Line A").map((machine) => (
                          <MachineTile key={machine.name} machine={machine} />
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(16,185,129,0.06)",
                        border: "1px solid rgba(16,185,129,0.18)",
                        borderRadius: "18px",
                        padding: isMobile ? "14px" : "18px",
                      }}
                    >
                      <div
                        style={{
                          color: "white",
                          fontSize: isMobile ? "18px" : "20px",
                          fontWeight: 700,
                          marginBottom: "12px",
                          textAlign: "center",
                        }}
                      >
                        Line B
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, minmax(220px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        {machines.filter((m) => m.line === "Line B").map((machine) => (
                          <MachineTile key={machine.name} machine={machine} />
                        ))}

                        <div
                          style={{
                            borderRadius: "18px",
                            border: "1px dashed #334155",
                            minHeight: isMobile ? "120px" : "260px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#64748b",
                            fontWeight: 700,
                            background: "rgba(15,23,42,0.5)",
                          }}
                        >
                          Reserved
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "20px",
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          background: "#101b2d",
                          borderRadius: "14px",
                          padding: "14px",
                          border: "1px solid #23344d",
                        }}
                      >
                        <div style={{ color: "#94a3b8", fontSize: "13px" }}>AGV / 物流區</div>
                        <div style={{ color: "white", fontSize: "18px", fontWeight: 700, marginTop: "6px" }}>
                          待整合
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#101b2d",
                          borderRadius: "14px",
                          padding: "14px",
                          border: "1px solid #23344d",
                        }}
                      >
                        <div style={{ color: "#94a3b8", fontSize: "13px" }}>檢驗區</div>
                        <div style={{ color: "white", fontSize: "18px", fontWeight: 700, marginTop: "6px" }}>
                          PMC / 品檢站
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#101b2d",
                          borderRadius: "14px",
                          padding: "14px",
                          border: "1px solid #23344d",
                        }}
                      >
                        <div style={{ color: "#94a3b8", fontSize: "13px" }}>數據模式</div>
                        <div style={{ color: "white", fontSize: "18px", fontWeight: 700, marginTop: "6px" }}>
                          Live Demo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "24px",
                }}
              >
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: "10px", color: "white", fontSize: "22px", fontWeight: 700 }}>
                    即時警報列表
                  </h3>
                  <div style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "10px" }}>
                    最近設備警報與停機事件
                  </div>

                  {alarms.map((item) => (
                    <div
                      key={`${item.time}-${item.machine}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "80px 100px 90px 1fr",
                        gap: "10px",
                        background: "#16253a",
                        borderRadius: "12px",
                        padding: "14px",
                        marginTop: "12px",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ color: "#fca5a5", fontWeight: 700 }}>{item.time}</div>
                      <div style={{ color: "white", fontWeight: 700 }}>{item.machine}</div>
                      <div style={{ color: "#93c5fd" }}>{item.code}</div>
                      <div style={{ color: "#e5e7eb" }}>{item.msg}</div>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: "10px", color: "white", fontSize: "22px", fontWeight: 700 }}>
                    導入路徑
                  </h3>

                  {[
                    ["A 階段", "展示版 Dashboard / 平面監控"],
                    ["B 階段", "模擬即時資料與互動查詢"],
                    ["C 階段", "串接 CNC / PLC / OPC UA"],
                  ].map(([phase, desc]) => (
                    <div
                      key={phase}
                      style={{
                        background: "#16253a",
                        borderRadius: "14px",
                        padding: "16px",
                        marginTop: "12px",
                      }}
                    >
                      <div style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 700 }}>{phase}</div>
                      <div style={{ color: "white", fontSize: "17px", fontWeight: 700, marginTop: "6px" }}>
                        {desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "24px", height: "fit-content" }}>
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>AI 工廠助理</h2>
                <p style={{ color: "#cbd5e1", marginTop: 0, fontSize: "15px" }}>
                  可直接輸入問題查詢，也可點選建議問題。這版為規則型半對話 AI。
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAiSubmit(aiInput);
                    }}
                    placeholder="輸入問題，例如：NV-10 狀態、哪台稼動率最低、Line A 產量"
                    style={{
                      width: "100%",
                      background: "#16253a",
                      border: "1px solid #24354e",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "white",
                      outline: "none",
                      fontSize: "14px",
                    }}
                  />

                  <button
                    onClick={() => handleAiSubmit(aiInput)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      cursor: "pointer",
                      fontWeight: 700,
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    送出
                  </button>
                </div>

                <div
                  style={{
                    background: "#16253a",
                    borderRadius: "12px",
                    padding: "14px",
                    marginTop: "16px",
                  }}
                >
                  <div style={{ color: "#93c5fd", fontSize: "13px", marginBottom: "8px" }}>使用者提問</div>
                  <div style={{ color: "white", fontSize: "16px", fontWeight: "700", lineHeight: 1.6 }}>
                    {currentQuestion}
                  </div>
                </div>

                <div
                  style={{
                    background: "#0b2942",
                    border: "1px solid #2563eb",
                    borderRadius: "12px",
                    padding: "16px",
                    marginTop: "16px",
                  }}
                >
                  <div style={{ color: "#38bdf8", fontSize: "13px", marginBottom: "10px" }}>系統回答</div>
                  <div style={{ color: "white", lineHeight: "1.9", fontSize: "15px", wordBreak: "break-word" }}>
                    {currentAnswer}
                  </div>
                </div>

                <div style={{ marginTop: "22px" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "10px" }}>建議問題</div>

                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAiSubmit(q)}
                      style={{
                        width: "100%",
                        background: currentQuestion === q ? "#0b2942" : "#16253a",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        marginBottom: "10px",
                        color: "white",
                        fontSize: "14px",
                        border: currentQuestion === q ? "1px solid #2563eb" : "1px solid transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        lineHeight: 1.6,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "10px", color: "white", fontSize: "22px", fontWeight: 700 }}>
                  系統狀態
                </h3>

                <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
                  {[
                    ["連線設備數", `${machines.length} 台`, "white"],
                    ["在線設備", `${runningCount} 台`, "#22c55e"],
                    ["待機設備", `${idleCount} 台`, "#f59e0b"],
                    ["異常設備", `${abnormalCount} 台`, "#ef4444"],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      style={{
                        background: "#16253a",
                        borderRadius: "12px",
                        padding: "14px",
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <span>{label}</span>
                      <b style={{ color, whiteSpace: "nowrap" }}>{value}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: "10px", color: "white", fontSize: "22px", fontWeight: 700 }}>
                  即時排行
                </h3>

                <div style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "10px" }}>模擬資料每 3 秒重新計算</div>

                {topOutputMachines.map((machine, index) => (
                  <div
                    key={machine.name}
                    style={{
                      background: "#16253a",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      color: "white",
                    }}
                  >
                    <span>{index + 1}. {machine.name}</span>
                    <b style={{ color: "#22c55e", whiteSpace: "nowrap" }}>{machine.output} 件</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDetailOpen && selectedMachine && selectedMachineDetail && (
        <div
          onClick={closeMachineDetail}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.76)",
            display: "flex",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: isMobile ? "0" : "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? "100%" : "min(860px, 100%)",
              height: isMobile ? "100vh" : "auto",
              maxHeight: isMobile ? "100vh" : "90vh",
              overflowY: "auto",
              background: "linear-gradient(180deg, #0f1b2d 0%, #0b1628 100%)",
              borderRadius: isMobile ? "0" : "22px",
              border: `1px solid ${getStatusColor(selectedMachine.status)}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: isMobile ? "16px" : "20px 24px",
                borderBottom: "1px solid #1f2f46",
                position: "sticky",
                top: 0,
                background: "linear-gradient(180deg, #0f1b2d 0%, #0b1628 100%)",
                zIndex: 2,
              }}
            >
              <div>
                <div style={{ color: "white", fontSize: isMobile ? "24px" : "30px", fontWeight: 700 }}>
                  {selectedMachine.name}
                </div>
                <div style={{ color: "#93c5fd", fontSize: "14px", marginTop: "6px" }}>
                  {selectedMachine.line}
                </div>
              </div>

              <button
                onClick={closeMachineDetail}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "999px",
                  border: "1px solid #334155",
                  background: "#0b1220",
                  color: "white",
                  fontSize: "20px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: isMobile ? "16px" : "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr auto auto auto",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="輸入機台號碼"
                  style={{
                    gridColumn: isMobile ? "1 / -1" : "auto",
                    width: "100%",
                    background: "#0b1220",
                    border: "1px solid #24354e",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    color: "white",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />

                <button
                  onClick={handleSearch}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  搜尋
                </button>

                <button
                  onClick={goPrevMachine}
                  disabled={!prevMachine}
                  style={{
                    background: prevMachine ? "#16253a" : "#0b1220",
                    color: prevMachine ? "white" : "#64748b",
                    border: "1px solid #24354e",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    cursor: prevMachine ? "pointer" : "not-allowed",
                    fontWeight: 700,
                  }}
                >
                  上一台
                </button>

                <button
                  onClick={goNextMachine}
                  disabled={!nextMachine}
                  style={{
                    background: nextMachine ? "#16253a" : "#0b1220",
                    color: nextMachine ? "white" : "#64748b",
                    border: "1px solid #24354e",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    cursor: nextMachine ? "pointer" : "not-allowed",
                    fontWeight: 700,
                  }}
                >
                  下一台
                </button>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  background: getStatusColor(selectedMachine.status),
                  color: "white",
                  borderRadius: "999px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "18px",
                }}
              >
                {selectedMachine.status}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ background: "#0b1220", borderRadius: "14px", padding: "14px", border: "1px solid #24354e" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "12px" }}>今日產量</div>
                  <div style={{ color: "white", fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>
                    {selectedMachine.output} 件
                  </div>
                </div>

                <div style={{ background: "#0b1220", borderRadius: "14px", padding: "14px", border: "1px solid #24354e" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "12px" }}>稼動率</div>
                  <div style={{ color: "white", fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>
                    {selectedMachine.util}%
                  </div>
                </div>

                <div style={{ background: "#0b1220", borderRadius: "14px", padding: "14px", border: "1px solid #24354e" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "12px" }}>估計停機時間</div>
                  <div style={{ color: "white", fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>
                    {selectedMachineDetail.estimatedDowntime}
                  </div>
                </div>
              </div>

              <div style={{ background: "#16253a", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "8px" }}>模擬停機 / 狀態原因</div>
                <div style={{ color: "white", lineHeight: 1.8 }}>{selectedMachineDetail.reason}</div>
              </div>

              <div style={{ background: "#16253a", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "8px" }}>建議動作</div>
                <div style={{ color: "white", lineHeight: 1.8 }}>{selectedMachineDetail.action}</div>
              </div>

              <div style={{ background: "#16253a", borderRadius: "14px", padding: "16px" }}>
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "10px" }}>最近警報明細</div>

                {selectedMachineDetail.alarmHistory.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#0b1220",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      marginBottom: "10px",
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "80px 110px 1fr 90px",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ color: "#fca5a5", fontWeight: 700 }}>{item.time}</div>
                    <div style={{ color: "#93c5fd", fontWeight: 700 }}>{item.code}</div>
                    <div style={{ color: "#e5e7eb" }}>{item.reason}</div>
                    <div
                      style={{
                        color: getAlarmStatusColor(item.status),
                        fontWeight: 700,
                        textAlign: isMobile ? "left" : "right",
                      }}
                    >
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}