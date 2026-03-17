import React, { useEffect, useMemo, useState } from "react";

const initialMachines = [
  {
    machineId: "VA0001",
    machineName: "SC-1165S",
    line: "LineA",
    status: "運轉中",
    output: 194,
    utilization: 96,
    completionTime: "2026/03/17 16:30",
    reason: "生產穩定進行中",
    owner: "Jimmy",
    programName: "Tray盤加工",
    currentPart: "鋁合金 Tray 盤",
    productionStartTime: "2026/03/17 08:10",
    productionQty: 50,
    alerts: [{ time: "09:20", code: "A-101", message: "刀具壽命接近上限" }],
  },
  {
    machineId: "VB0001",
    machineName: "SV-110S",
    line: "LineA",
    status: "運轉中",
    output: 115,
    utilization: 57,
    completionTime: "2026/03/17 17:10",
    reason: "加工持續中",
    owner: "Andy",
    programName: "壓圈加工",
    currentPart: "壓圈",
    productionStartTime: "2026/03/17 07:50",
    productionQty: 50,
    alerts: [],
  },
  {
    machineId: "VC0001",
    machineName: "SV-76S",
    line: "LineB",
    status: "異常停止",
    output: 187,
    utilization: 85,
    completionTime: "延遲",
    reason: "主軸負載過高，設備停機中",
    owner: "Tim",
    programName: "載板加工",
    currentPart: "精密載板",
    productionStartTime: "2026/03/17 08:20",
    productionQty: 50,
    alerts: [
      { time: "11:24", code: "S-201", message: "工單切換完成" },
      { time: "11:24", code: "E-118", message: "主軸負載過高" },
    ],
  },
  {
    machineId: "VD0001",
    machineName: "NV-8",
    line: "LineB",
    status: "異常停止",
    output: 52,
    utilization: 20,
    completionTime: "延遲",
    reason: "刀具異常磨耗，設備停機中",
    owner: "Jerry",
    programName: "瓶胚模",
    currentPart: "瓶胚模仁",
    productionStartTime: "2026/03/17 08:05",
    productionQty: 50,
    alerts: [{ time: "10:18", code: "E-404", message: "刀具異常停機" }],
  },
  {
    machineId: "VE0001",
    machineName: "NV-10",
    line: "LineC",
    status: "運轉中",
    output: 163,
    utilization: 84,
    completionTime: "2026/03/17 16:10",
    reason: "正常量產中",
    owner: "Apple",
    programName: "Tray盤加工",
    currentPart: "Tray 盤治具",
    productionStartTime: "2026/03/17 08:30",
    productionQty: 50,
    alerts: [{ time: "09:45", code: "A-087", message: "冷卻液液位偏低" }],
  },
  {
    machineId: "VF0001",
    machineName: "S56-MT",
    line: "LineC",
    status: "運轉中",
    output: 128,
    utilization: 82,
    completionTime: "2026/03/17 17:40",
    reason: "生產節拍穩定",
    owner: "Jimmy",
    programName: "載板加工",
    currentPart: "半導體載板",
    productionStartTime: "2026/03/17 07:40",
    productionQty: 50,
    alerts: [],
  },
];

const suggestionQuestions = [
  "哪台稼動率最低？",
  "哪台產量最高？",
  "哪些設備異常停止？",
  "LineA 產量如何？",
  "NV-8 狀態？",
];

const statusColorMap = {
  運轉中: "#22c55e",
  待機: "#f59e0b",
  異常停止: "#ef4444",
};

const alertTemplates = [
  { code: "A-101", message: "刀具壽命接近上限" },
  { code: "A-087", message: "冷卻液液位偏低" },
  { code: "E-404", message: "刀具異常停機" },
  { code: "E-118", message: "主軸負載過高" },
  { code: "S-201", message: "工單切換完成" },
];

function App() {
  const [machines, setMachines] = useState(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [viewMode, setViewMode] = useState("factory");
  const [selectedLine, setSelectedLine] = useState("LineA");
  const [now, setNow] = useState(new Date());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      text: "您好，我是 SHINZAWA AI 工廠助理。您可以詢問整廠、產線、機台狀態、產量、稼動率與警報資訊。",
    },
  ]);

  const lines = useMemo(
    () => [...new Set(machines.map((machine) => machine.line))],
    [machines]
  );

  const filteredMachines = useMemo(() => {
    const baseMachines =
      viewMode === "factory"
        ? machines
        : machines.filter((machine) => machine.line === selectedLine);

    if (!searchKeyword.trim()) return baseMachines;

    const keyword = searchKeyword.trim().toLowerCase();
    return baseMachines.filter((machine) => {
      return (
        machine.machineId.toLowerCase().includes(keyword) ||
        machine.machineName.toLowerCase().includes(keyword) ||
        machine.line.toLowerCase().includes(keyword) ||
        machine.status.toLowerCase().includes(keyword) ||
        machine.owner.toLowerCase().includes(keyword) ||
        machine.programName.toLowerCase().includes(keyword)
      );
    });
  }, [machines, viewMode, selectedLine, searchKeyword]);

  const selectedLineMachines = useMemo(() => {
    return machines.filter((machine) => machine.line === selectedLine);
  }, [machines, selectedLine]);

  const lineSummary = useMemo(() => {
    const running = selectedLineMachines.filter(
      (machine) => machine.status === "運轉中"
    ).length;
    const idle = selectedLineMachines.filter(
      (machine) => machine.status === "待機"
    ).length;
    const abnormal = selectedLineMachines.filter(
      (machine) => machine.status === "異常停止"
    ).length;
    const totalOutput = selectedLineMachines.reduce(
      (sum, machine) => sum + machine.output,
      0
    );
    const avgUtilization = selectedLineMachines.length
      ? Math.round(
          selectedLineMachines.reduce(
            (sum, machine) => sum + machine.utilization,
            0
          ) / selectedLineMachines.length
        )
      : 0;

    return {
      running,
      idle,
      abnormal,
      totalOutput,
      avgUtilization,
    };
  }, [selectedLineMachines]);

  const overallSummary = useMemo(() => {
    const running = machines.filter((m) => m.status === "運轉中").length;
    const idle = machines.filter((m) => m.status === "待機").length;
    const abnormal = machines.filter((m) => m.status === "異常停止").length;
    const totalOutput = machines.reduce((sum, m) => sum + m.output, 0);
    const avgUtilization = machines.length
      ? Math.round(
          machines.reduce((sum, m) => sum + m.utilization, 0) / machines.length
        )
      : 0;

    return {
      running,
      idle,
      abnormal,
      totalOutput,
      avgUtilization,
    };
  }, [machines]);

  const alertList = useMemo(() => {
    return machines
      .flatMap((machine) =>
        machine.alerts.map((alert) => ({
          ...alert,
          machineId: machine.machineId,
          machineName: machine.machineName,
          line: machine.line,
          status: machine.status,
        }))
      )
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 8);
  }, [machines]);

  const selectedMachineIndex = useMemo(() => {
    if (!selectedMachine) return -1;
    return machines.findIndex(
      (machine) => machine.machineId === selectedMachine.machineId
    );
  }, [machines, selectedMachine]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const simulationTimer = setInterval(() => {
      setMachines((prevMachines) =>
        prevMachines.map((machine) => {
          const random = Math.random();
          let nextStatus = machine.status;

          if (random < 0.08) {
            const statusPool = ["運轉中", "待機", "異常停止"];
            nextStatus =
              statusPool[Math.floor(Math.random() * statusPool.length)];
          }

          let output = machine.output;
          let utilization = machine.utilization;
          let reason = machine.reason;
          let alerts = [...machine.alerts];

          if (nextStatus === "運轉中") {
            output = output + Math.floor(Math.random() * 4);
            utilization = Math.min(
              96,
              utilization + Math.floor(Math.random() * 3)
            );
            reason = ["生產穩定進行中", "正常量產中", "加工節拍穩定"][
              Math.floor(Math.random() * 3)
            ];
          } else if (nextStatus === "待機") {
            utilization = Math.max(
              45,
              utilization - Math.floor(Math.random() * 3)
            );
            reason = ["等待下一批工單", "等待品檢完成", "等待換線作業"][
              Math.floor(Math.random() * 3)
            ];
          } else if (nextStatus === "異常停止") {
            utilization = Math.max(
              20,
              utilization - Math.floor(Math.random() * 4)
            );
            reason = ["刀具異常磨耗，設備停機中", "主軸負載過高，等待確認", "夾治具異常，暫停加工"][
              Math.floor(Math.random() * 3)
            ];

            if (Math.random() < 0.25) {
              const pickedAlert =
                alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
              alerts = [
                {
                  time: formatTime(new Date()),
                  code: pickedAlert.code,
                  message: pickedAlert.message,
                },
                ...alerts,
              ].slice(0, 5);
            }
          }

          return {
            ...machine,
            status: nextStatus,
            output,
            utilization,
            reason,
            alerts,
          };
        })
      );
    }, 3500);

    return () => clearInterval(simulationTimer);
  }, []);

  useEffect(() => {
    if (!selectedMachine) return;
    const latest = machines.find(
      (machine) => machine.machineId === selectedMachine.machineId
    );
    if (latest) {
      setSelectedMachine(latest);
    }
  }, [machines, selectedMachine]);

  const handleOpenMachine = (machine) => {
    setSelectedMachine(machine);
  };

  const handlePrevMachine = () => {
    if (selectedMachineIndex <= 0) {
      setSelectedMachine(machines[machines.length - 1]);
      return;
    }
    setSelectedMachine(machines[selectedMachineIndex - 1]);
  };

  const handleNextMachine = () => {
    if (
      selectedMachineIndex === -1 ||
      selectedMachineIndex === machines.length - 1
    ) {
      setSelectedMachine(machines[0]);
      return;
    }
    setSelectedMachine(machines[selectedMachineIndex + 1]);
  };

  const submitAI = (forcedQuestion) => {
    const question = (forcedQuestion ?? aiInput).trim();
    if (!question) return;

    const answer = generateAIResponse(question, machines, lines);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "assistant", text: answer },
    ]);

    setAiInput("");
  };

  const handleAIQuestion = (question) => {
    setAiInput(question);
    submitAI(question);
  };

  const displaySummary =
    viewMode === "factory" ? overallSummary : lineSummary;
  const displaySummaryTitle =
    viewMode === "factory" ? "整廠總覽" : `${selectedLine} 產線摘要`;

  return (
    <div style={styles.app}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>S</div>
            <div style={styles.titleWrap}>
              <h1 style={styles.title}>SHINZAWA Smart Factory</h1>
              <div style={styles.subtitle}>震澤智慧工廠展示系統 v1.0</div>
            </div>
          </div>
        </div>

        <div style={styles.timeCard}>
          <div style={styles.timeLabel}>系統時間</div>
          <div style={styles.timeValue}>{formatDateTime(now)}</div>
        </div>
      </header>

      <section style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>總機台數</div>
          <div style={styles.kpiValue}>{machines.length}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>運轉中</div>
          <div style={styles.kpiValue}>{overallSummary.running}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>待機</div>
          <div style={styles.kpiValue}>{overallSummary.idle}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>異常停止</div>
          <div style={styles.kpiValue}>{overallSummary.abnormal}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>今日總產量</div>
          <div style={styles.kpiValue}>{overallSummary.totalOutput}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>平均稼動率</div>
          <div style={styles.kpiValue}>{overallSummary.avgUtilization}%</div>
        </div>
      </section>

      <section style={styles.mainLayout}>
        <div style={styles.leftArea}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>3D 平面產線監控</h2>
                <div style={styles.panelDesc}>可切換整廠總覽與指定產線監控</div>
              </div>
            </div>

            <div style={styles.monitorToolbar}>
              <div style={styles.modeGroup}>
                <span style={styles.toolbarLabel}>監控模式</span>
                <button
                  style={
                    viewMode === "factory"
                      ? styles.activeModeButton
                      : styles.modeButton
                  }
                  onClick={() => setViewMode("factory")}
                >
                  整廠總覽
                </button>
                <button
                  style={
                    viewMode === "line"
                      ? styles.activeModeButton
                      : styles.modeButton
                  }
                  onClick={() => setViewMode("line")}
                >
                  依產線查看
                </button>
              </div>

              {viewMode === "line" && (
                <div style={styles.lineGroup}>
                  <span style={styles.toolbarLabel}>選擇產線</span>
                  {lines.map((line) => (
                    <button
                      key={line}
                      style={
                        selectedLine === line
                          ? styles.activeLineButton
                          : styles.lineButton
                      }
                      onClick={() => setSelectedLine(line)}
                    >
                      {line}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.lineSummaryCard}>
              <div style={styles.lineSummaryTitle}>{displaySummaryTitle}</div>
              <div style={styles.lineSummaryGrid}>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>運轉中</div>
                  <div style={styles.summaryValue}>{displaySummary.running} 台</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>待機</div>
                  <div style={styles.summaryValue}>{displaySummary.idle} 台</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>異常停止</div>
                  <div style={styles.summaryValue}>{displaySummary.abnormal} 台</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>今日產量</div>
                  <div style={styles.summaryValue}>{displaySummary.totalOutput} 件</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>平均稼動率</div>
                  <div style={styles.summaryValue}>{displaySummary.avgUtilization}%</div>
                </div>
              </div>
            </div>

            <div style={styles.searchRow}>
              <input
                style={styles.searchInput}
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋機台 / 人員 / 產線 / 程式名稱"
              />
            </div>

            <div style={styles.factoryMap}>
              {viewMode === "factory" ? (
                lines.map((line) => {
                  const lineMachines = filteredMachines.filter(
                    (machine) => machine.line === line
                  );

                  if (lineMachines.length === 0) return null;

                  return (
                    <div key={line} style={styles.lineSection}>
                      <div style={styles.lineSectionHeader}>
                        <div style={styles.lineSectionTitle}>{line}</div>
                        <div style={styles.lineSectionCount}>
                          {lineMachines.length} 台設備
                        </div>
                      </div>

                      <div style={styles.machineGrid}>
                        {lineMachines.map((machine) => (
                          <MachineCard
                            key={machine.machineId}
                            machine={machine}
                            onClick={() => handleOpenMachine(machine)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={styles.lineSection}>
                  <div style={styles.lineSectionHeader}>
                    <div style={styles.lineSectionTitle}>{selectedLine}</div>
                    <div style={styles.lineSectionCount}>
                      {filteredMachines.length} 台設備
                    </div>
                  </div>

                  <div style={styles.machineGrid}>
                    {filteredMachines.map((machine) => (
                      <MachineCard
                        key={machine.machineId}
                        machine={machine}
                        onClick={() => handleOpenMachine(machine)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredMachines.length === 0 && (
                <div style={styles.emptyState}>查無符合條件的機台資料</div>
              )}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>設備列表</h2>
                <div style={styles.panelDesc}>點選設備可查看詳細狀態、生產資訊與警報</div>
              </div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>機台</th>
                    <th style={styles.th}>當責人員</th>
                    <th style={styles.th}>產線</th>
                    <th style={styles.th}>狀態</th>
                    <th style={styles.th}>今日產量</th>
                    <th style={styles.th}>稼動率</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => (
                    <tr
                      key={machine.machineId}
                      style={styles.tr}
                      onClick={() => handleOpenMachine(machine)}
                    >
                      <td style={styles.td}>{machine.machineId}</td>
                      <td style={styles.td}>{machine.owner}</td>
                      <td style={styles.td}>{machine.line}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: `${statusColorMap[machine.status]}22`,
                            color: statusColorMap[machine.status],
                            borderColor: `${statusColorMap[machine.status]}66`,
                          }}
                        >
                          {machine.status}
                        </span>
                      </td>
                      <td style={styles.td}>{machine.output}</td>
                      <td style={styles.td}>{machine.utilization}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={styles.rightArea}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>AI 工廠助理</h2>
                <div style={styles.panelDesc}>支援產線摘要、機台狀態、產量與異常查詢</div>
              </div>
            </div>

            <div style={styles.suggestionWrap}>
              {suggestionQuestions.map((question) => (
                <button
                  key={question}
                  style={styles.suggestionButton}
                  onClick={() => handleAIQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>

            <div style={styles.chatBox}>
              {chatHistory.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  style={{
                    ...styles.chatBubble,
                    ...(item.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble),
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>

            <div style={styles.chatInputRow}>
              <input
                style={styles.chatInput}
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="例如：NV-8 狀態？、哪台產量最高？"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAI();
                }}
              />
              <button style={styles.sendButton} onClick={() => submitAI()}>
                送出
              </button>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>即時警報列表</h2>
                <div style={styles.panelDesc}>顯示最新警報與提醒資訊</div>
              </div>
            </div>

            <div style={styles.alertFeed}>
              {alertList.length > 0 ? (
                alertList.map((alert, index) => (
                  <div
                    key={`${alert.machineId}-${alert.code}-${index}`}
                    style={styles.alertFeedItem}
                  >
                    <div style={styles.alertFeedTop}>
                      <span style={styles.alertFeedMachine}>{alert.machineId}</span>
                      <span style={styles.alertFeedTime}>{alert.time}</span>
                    </div>
                    <div style={styles.alertFeedMeta}>
                      <span style={styles.alertFeedLine}>{alert.line}</span>
                      <span style={styles.alertFeedCode}>{alert.code}</span>
                    </div>
                    <div style={styles.alertFeedMessage}>{alert.message}</div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>目前無警報資料</div>
              )}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>導入路徑</h2>
                <div style={styles.panelDesc}>展示型 Demo 可延伸至真實工廠資料串接</div>
              </div>
            </div>

            <div style={styles.roadmap}>
              <div style={styles.roadmapItem}>
                <div style={styles.roadmapStep}>A</div>
                <div>
                  <div style={styles.roadmapTitle}>展示版</div>
                  <div style={styles.roadmapText}>
                    建立品牌化智慧工廠畫面與可視化監控介面。
                  </div>
                </div>
              </div>
              <div style={styles.roadmapItem}>
                <div style={styles.roadmapStep}>B</div>
                <div>
                  <div style={styles.roadmapTitle}>模擬互動版</div>
                  <div style={styles.roadmapText}>
                    加入模擬即時資料、AI 助理與單機詳細資訊。
                  </div>
                </div>
              </div>
              <div style={styles.roadmapItem}>
                <div style={styles.roadmapStep}>C</div>
                <div>
                  <div style={styles.roadmapTitle}>實際串接版</div>
                  <div style={styles.roadmapText}>
                    未來可接 CNC / PLC / OPC UA / MES 等真實系統資料。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedMachine && (
        <div style={styles.modalOverlay} onClick={() => setSelectedMachine(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedMachine.machineId}</h2>
                <div style={styles.modalSubtitle}>
                  {selectedMachine.line} ｜ {selectedMachine.status} ｜ 當責人員{" "}
                  {selectedMachine.owner}
                </div>
              </div>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedMachine(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalActionRow}>
              <input
                style={styles.modalSearchInput}
                type="text"
                placeholder="輸入機台型號，例如 NV-8"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const keyword = e.currentTarget.value.trim().toLowerCase();
                  const found = machines.find(
                    (machine) => machine.machineId.toLowerCase() === keyword
                  );
                  if (found) setSelectedMachine(found);
                }}
              />
              <div style={styles.modalNavButtons}>
                <button style={styles.modalNavButton} onClick={handlePrevMachine}>
                  上一台
                </button>
                <button style={styles.modalNavButton} onClick={handleNextMachine}>
                  下一台
                </button>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>設備狀態</div>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>機台</div>
                  <div style={styles.detailValue}>{selectedMachine.machineId}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>產線</div>
                  <div style={styles.detailValue}>{selectedMachine.line}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>狀態</div>
                  <div
                    style={{
                      ...styles.detailValue,
                      color: statusColorMap[selectedMachine.status],
                      fontWeight: 700,
                    }}
                  >
                    {selectedMachine.status}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>今日產量</div>
                  <div style={styles.detailValue}>{selectedMachine.output} 件</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>稼動率</div>
                  <div style={styles.detailValue}>{selectedMachine.utilization}%</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>完工時間</div>
                  <div style={styles.detailValue}>{selectedMachine.completionTime}</div>
                </div>
                <div style={styles.detailItemFull}>
                  <div style={styles.detailLabel}>狀態說明</div>
                  <div style={styles.detailValue}>{selectedMachine.reason}</div>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>目前生產資訊</div>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>當責人員</div>
                  <div style={styles.detailValue}>{selectedMachine.owner}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>程式名稱</div>
                  <div style={styles.detailValue}>{selectedMachine.programName}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>機台暱稱</div>
                  <div style={styles.detailValue}>{selectedMachine.machineName}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>目前生產工件</div>
                  <div style={styles.detailValue}>{selectedMachine.currentPart}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>生產起始時間</div>
                  <div style={styles.detailValue}>{selectedMachine.productionStartTime}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>生產數量</div>
                  <div style={styles.detailValue}>{selectedMachine.productionQty} 件</div>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>最近警報明細</div>
              <div style={styles.alertList}>
                {selectedMachine.alerts.length > 0 ? (
                  selectedMachine.alerts.map((alert, index) => (
                    <div key={`${alert.code}-${index}`} style={styles.alertItem}>
                      <div style={styles.alertTime}>{alert.time}</div>
                      <div style={styles.alertCode}>{alert.code}</div>
                      <div style={styles.alertMessage}>{alert.message}</div>
                    </div>
                  ))
                ) : (
                  <div style={styles.noAlertText}>目前無警報紀錄</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MachineCard({ machine, onClick }) {
  return (
    <button style={styles.machineCard} onClick={onClick}>
      <div style={styles.machineCardTop}>
        <div style={styles.machineName}>{machine.machineId}</div>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: statusColorMap[machine.status],
            boxShadow: `0 0 12px ${statusColorMap[machine.status]}`,
          }}
        />
      </div>

      <div style={styles.machineMeta}>當責人員：{machine.owner}</div>

      <div style={styles.machineInfoRow}>
        <span style={styles.machineInfoLabel}>狀態</span>
        <span
          style={{
            ...styles.machineInfoValue,
            color: statusColorMap[machine.status],
          }}
        >
          {machine.status}
        </span>
      </div>

      <div style={styles.machineInfoRow}>
        <span style={styles.machineInfoLabel}>今日產量</span>
        <span style={styles.machineInfoValue}>{machine.output} 件</span>
      </div>

      <div style={styles.machineInfoRow}>
        <span style={styles.machineInfoLabel}>稼動率</span>
        <span style={styles.machineInfoValue}>{machine.utilization}%</span>
      </div>

      <div style={styles.machineInfoRow}>
        <span style={styles.machineInfoLabel}>程式名稱</span>
        <span style={styles.machineInfoValue}>{machine.programName}</span>
      </div>
    </button>
  );
}

function generateAIResponse(question, machines, lines) {
  const text = question.trim().toLowerCase();

  const abnormalMachines = machines.filter(
    (machine) => machine.status === "異常停止"
  );
  const lowestUtilizationMachine = [...machines].sort(
    (a, b) => a.utilization - b.utilization
  )[0];
  const highestOutputMachine = [...machines].sort(
    (a, b) => b.output - a.output
  )[0];

  if (text.includes("稼動率最低")) {
    return `目前稼動率最低的是 ${lowestUtilizationMachine.machineId}，稼動率 ${lowestUtilizationMachine.utilization}%，目前狀態為 ${lowestUtilizationMachine.status}。`;
  }

  if (text.includes("產量最高")) {
    return `目前產量最高的是 ${highestOutputMachine.machineId}，今日產量 ${highestOutputMachine.output} 件，位於 ${highestOutputMachine.line}。`;
  }

  if (text.includes("異常") || text.includes("停機")) {
    if (abnormalMachines.length === 0) {
      return "目前沒有異常停止設備。";
    }
    return `目前異常停止設備共有 ${abnormalMachines.length} 台：${abnormalMachines
      .map((m) => `${m.machineId}（${m.reason}）`)
      .join("、")}。`;
  }

  for (const line of lines) {
    if (text.includes(line.toLowerCase())) {
      const lineMachines = machines.filter((machine) => machine.line === line);
      const totalOutput = lineMachines.reduce(
        (sum, machine) => sum + machine.output,
        0
      );
      const avgUtilization = Math.round(
        lineMachines.reduce((sum, machine) => sum + machine.utilization, 0) /
          lineMachines.length
      );
      const abnormalCount = lineMachines.filter(
        (machine) => machine.status === "異常停止"
      ).length;

      return `${line} 目前共有 ${lineMachines.length} 台設備，今日總產量 ${totalOutput} 件，平均稼動率 ${avgUtilization}%，異常停止台數 ${abnormalCount} 台。`;
    }
  }

  const machineFound = machines.find(
    (machine) =>
      text.includes(machine.machineId.toLowerCase()) ||
      text.includes(machine.owner.toLowerCase())
  );

  if (machineFound) {
    if (text.includes("狀態")) {
      return `${machineFound.machineId} 目前狀態為 ${machineFound.status}，原因為：${machineFound.reason}。`;
    }
    if (text.includes("產量")) {
      return `${machineFound.machineId} 今日產量為 ${machineFound.output} 件，目標生產數量為 ${machineFound.productionQty} 件。`;
    }
    if (text.includes("稼動率")) {
      return `${machineFound.machineId} 目前稼動率為 ${machineFound.utilization}%。`;
    }
    if (text.includes("警報")) {
      if (!machineFound.alerts.length) {
        return `${machineFound.machineId} 目前沒有警報紀錄。`;
      }
      const latestAlert = machineFound.alerts[0];
      return `${machineFound.machineId} 最新警報為 ${latestAlert.time} 的 ${latestAlert.code}，內容是「${latestAlert.message}」。`;
    }

    return `${machineFound.machineId} 位於 ${machineFound.line}，目前狀態 ${machineFound.status}，今日產量 ${machineFound.output} 件，稼動率 ${machineFound.utilization}%。`;
  }

  return "我可以協助查詢整廠、單一產線、指定機台的狀態、產量、稼動率與警報資訊。";
}

function formatTime(date) {
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateTime(date) {
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const styles = {
  app: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 28%), radial-gradient(circle at top right, rgba(14,165,233,0.15), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
    color: "#ffffff",
    padding: "20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif',
    position: "relative",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(37, 99, 235, 0.12)",
    filter: "blur(80px)",
    top: "-120px",
    left: "-100px",
    pointerEvents: "none",
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: "rgba(14, 165, 233, 0.1)",
    filter: "blur(80px)",
    bottom: "-160px",
    right: "-100px",
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "16px",
    alignItems: "center",
    marginBottom: "20px",
  },
  headerLeft: {
    minWidth: 0,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },
  titleWrap: {
    minWidth: 0,
  },
  logoBadge: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: 800,
    color: "#ffffff",
    flexShrink: 0,
    boxShadow: "0 12px 32px rgba(37, 99, 235, 0.35)",
  },
  title: {
    margin: 0,
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 800,
    letterSpacing: "0.4px",
    color: "#ffffff",
    wordBreak: "break-word",
  },
  subtitle: {
    color: "#ffffff",
    marginTop: "6px",
    fontSize: "14px",
  },
  timeCard: {
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "18px",
    padding: "14px 18px",
    minWidth: "260px",
    maxWidth: "100%",
    boxSizing: "border-box",
    backdropFilter: "blur(10px)",
  },
  timeLabel: {
    color: "#ffffff",
    fontSize: "13px",
    marginBottom: "4px",
  },
  timeValue: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#ffffff",
    wordBreak: "break-word",
  },
  kpiGrid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  kpiCard: {
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "18px",
    padding: "18px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(2, 6, 23, 0.25)",
    minWidth: 0,
  },
  kpiLabel: {
    color: "#ffffff",
    fontSize: "13px",
    marginBottom: "10px",
  },
  kpiValue: {
    fontSize: "30px",
    fontWeight: 800,
    lineHeight: 1,
    color: "#ffffff",
  },
  mainLayout: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(360px, 0.9fr)",
    gap: "20px",
    alignItems: "start",
  },
  leftArea: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0,
  },
  rightArea: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0,
  },
  panel: {
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "22px",
    padding: "20px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(2, 6, 23, 0.25)",
    minWidth: 0,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  panelTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#ffffff",
  },
  panelDesc: {
    color: "#ffffff",
    fontSize: "14px",
    marginTop: "6px",
  },
  monitorToolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  modeGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  lineGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  toolbarLabel: {
    color: "#ffffff",
    fontSize: "14px",
    marginRight: "4px",
  },
  modeButton: {
    background: "#1e293b",
    color: "#ffffff",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
  },
  activeModeButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
  },
  lineButton: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
  },
  activeLineButton: {
    background: "#0ea5e9",
    color: "#ffffff",
    border: "1px solid #0ea5e9",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
  },
  lineSummaryCard: {
    background: "rgba(2, 6, 23, 0.65)",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
  },
  lineSummaryTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
    textAlign: "center",
  },
  lineSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "12px",
  },
  summaryItem: {
    background: "#111827",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid rgba(148,163,184,0.12)",
    minWidth: 0,
  },
  summaryLabel: {
    color: "#ffffff",
    fontSize: "13px",
    marginBottom: "6px",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 700,
  },
  searchRow: {
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#ffffff",
    outline: "none",
    fontSize: "14px",
  },
  factoryMap: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  lineSection: {
    background: "rgba(2, 6, 23, 0.42)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "18px",
    padding: "16px",
  },
  lineSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  lineSectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#ffffff",
  },
  lineSectionCount: {
    color: "#ffffff",
    fontSize: "14px",
  },
  machineGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  machineCard: {
    border: "1px solid rgba(148,163,184,0.14)",
    background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
    borderRadius: "16px",
    padding: "14px",
    textAlign: "left",
    color: "#ffffff",
    cursor: "pointer",
    transition: "transform 0.18s ease, border-color 0.18s ease",
    minWidth: 0,
  },
  machineCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    marginBottom: "6px",
  },
  machineName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#ffffff",
    wordBreak: "break-word",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    flexShrink: 0,
  },
  machineMeta: {
    color: "#ffffff",
    fontSize: "13px",
    marginBottom: "12px",
    wordBreak: "break-word",
  },
  machineInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "8px",
  },
  machineInfoLabel: {
    color: "#ffffff",
    fontSize: "13px",
  },
  machineInfoValue: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "right",
    wordBreak: "break-word",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "720px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 600,
    borderBottom: "1px solid rgba(148,163,184,0.14)",
    whiteSpace: "nowrap",
  },
  tr: {
    cursor: "pointer",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
    fontSize: "14px",
    color: "#ffffff",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid transparent",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  suggestionWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "14px",
  },
  suggestionButton: {
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "9px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },
  chatBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "rgba(2, 6, 23, 0.42)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "16px",
    padding: "14px",
    minHeight: "260px",
    maxHeight: "360px",
    overflowY: "auto",
    marginBottom: "12px",
  },
  chatBubble: {
    maxWidth: "88%",
    padding: "12px 14px",
    borderRadius: "14px",
    lineHeight: 1.6,
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    color: "#ffffff",
    wordBreak: "break-word",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "#1d4ed8",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  chatInputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
  },
  chatInput: {
    width: "100%",
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#ffffff",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  sendButton: {
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "0 18px",
    cursor: "pointer",
    fontWeight: 700,
    whiteSpace: "nowrap",
    minHeight: "44px",
  },
  alertFeed: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  alertFeedItem: {
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "14px",
    padding: "12px",
  },
  alertFeedTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "6px",
  },
  alertFeedMachine: {
    fontWeight: 700,
    fontSize: "14px",
    color: "#ffffff",
    wordBreak: "break-word",
  },
  alertFeedTime: {
    color: "#ffffff",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  alertFeedMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  alertFeedLine: {
    color: "#ffffff",
    fontSize: "13px",
  },
  alertFeedCode: {
    color: "#f59e0b",
    fontSize: "13px",
    fontWeight: 700,
  },
  alertFeedMessage: {
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  roadmap: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  roadmapItem: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "12px 0",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
  },
  roadmapStep: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    color: "#ffffff",
    flexShrink: 0,
  },
  roadmapTitle: {
    fontWeight: 700,
    marginBottom: "4px",
    color: "#ffffff",
  },
  roadmapText: {
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  emptyState: {
    color: "#ffffff",
    textAlign: "center",
    padding: "24px 12px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.76)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 999,
    boxSizing: "border-box",
  },
  modalContent: {
    width: "min(960px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
    color: "#ffffff",
    wordBreak: "break-word",
  },
  modalSubtitle: {
    color: "#ffffff",
    marginTop: "6px",
    fontSize: "14px",
    wordBreak: "break-word",
  },
  closeButton: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#ffffff",
    fontSize: "24px",
    cursor: "pointer",
    lineHeight: 1,
    flexShrink: 0,
  },
  modalActionRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    marginBottom: "22px",
    alignItems: "center",
  },
  modalSearchInput: {
    width: "100%",
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#ffffff",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  modalNavButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  modalNavButton: {
    border: "1px solid #334155",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "0 14px",
    cursor: "pointer",
    fontSize: "14px",
    minHeight: "44px",
  },
  detailSection: {
    marginBottom: "24px",
  },
  detailSectionTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  detailItem: {
    background: "#111827",
    borderRadius: "12px",
    padding: "12px",
    border: "1px solid rgba(148,163,184,0.1)",
    minWidth: 0,
  },
  detailItemFull: {
    background: "#111827",
    borderRadius: "12px",
    padding: "12px",
    gridColumn: "1 / -1",
    border: "1px solid rgba(148,163,184,0.1)",
  },
  detailLabel: {
    color: "#ffffff",
    fontSize: "13px",
    marginBottom: "6px",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: "15px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  alertItem: {
    display: "grid",
    gridTemplateColumns: "80px 100px minmax(0, 1fr)",
    gap: "10px",
    background: "#111827",
    borderRadius: "12px",
    padding: "12px",
    alignItems: "center",
    border: "1px solid rgba(148,163,184,0.1)",
  },
  alertTime: {
    color: "#ffffff",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  alertCode: {
    color: "#f59e0b",
    fontSize: "14px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  alertMessage: {
    color: "#ffffff",
    fontSize: "14px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  noAlertText: {
    color: "#ffffff",
    fontSize: "14px",
  },
};

const responsiveCss = `
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
    background: #0f172a;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  @media (max-width: 1400px) {
    .rwd-kpi-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 1180px) {
    .rwd-main-layout {
      grid-template-columns: 1fr !important;
    }

    .rwd-right-area {
      order: 2;
    }

    .rwd-left-area {
      order: 1;
    }

    .rwd-line-summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }

    .rwd-detail-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 900px) {
    .rwd-header {
      grid-template-columns: 1fr !important;
    }

    .rwd-time-card {
      min-width: 0 !important;
      width: 100% !important;
    }

    .rwd-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .rwd-chat-input-row {
      grid-template-columns: 1fr !important;
    }

    .rwd-modal-action-row {
      grid-template-columns: 1fr !important;
    }

    .rwd-line-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .rwd-alert-item {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 640px) {
    .rwd-app {
      padding: 14px !important;
    }

    .rwd-panel {
      padding: 14px !important;
      border-radius: 16px !important;
    }

    .rwd-kpi-grid {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .rwd-line-summary-grid {
      grid-template-columns: 1fr !important;
    }

    .rwd-machine-grid {
      grid-template-columns: 1fr !important;
    }

    .rwd-detail-grid {
      grid-template-columns: 1fr !important;
    }

    .rwd-title {
      font-size: 28px !important;
    }

    .rwd-panel-title {
      font-size: 20px !important;
    }

    .rwd-modal-content {
      padding: 16px !important;
      border-radius: 18px !important;
      max-height: 92vh !important;
    }

    .rwd-modal-title {
      font-size: 24px !important;
    }

    .rwd-table {
      min-width: 620px !important;
    }

    .rwd-send-button {
      width: 100% !important;
      min-height: 44px !important;
    }

    .rwd-monitor-toolbar {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .rwd-mode-group,
    .rwd-line-group {
      width: 100% !important;
    }

    .rwd-mode-group button,
    .rwd-line-group button {
      flex: 1 1 auto;
    }
  }
`;

function ResponsiveWrapper({ children }) {
  return (
    <>
      <style>{responsiveCss}</style>
      {children}
    </>
  );
}

const OriginalApp = App;

function WrappedApp() {
  return (
    <ResponsiveWrapper>
      <OriginalAppWithClasses />
    </ResponsiveWrapper>
  );
}

function OriginalAppWithClasses() {
  const [machines, setMachines] = useState(initialMachines);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [viewMode, setViewMode] = useState("factory");
  const [selectedLine, setSelectedLine] = useState("LineA");
  const [now, setNow] = useState(new Date());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      text: "您好，我是 SHINZAWA AI 工廠助理。您可以詢問整廠、產線、機台狀態、產量、稼動率與警報資訊。",
    },
  ]);

  const lines = useMemo(
    () => [...new Set(machines.map((machine) => machine.line))],
    [machines]
  );

  const filteredMachines = useMemo(() => {
    const baseMachines =
      viewMode === "factory"
        ? machines
        : machines.filter((machine) => machine.line === selectedLine);

    if (!searchKeyword.trim()) return baseMachines;

    const keyword = searchKeyword.trim().toLowerCase();
    return baseMachines.filter((machine) => {
      return (
        machine.machineId.toLowerCase().includes(keyword) ||
        machine.machineName.toLowerCase().includes(keyword) ||
        machine.line.toLowerCase().includes(keyword) ||
        machine.status.toLowerCase().includes(keyword) ||
        machine.owner.toLowerCase().includes(keyword) ||
        machine.programName.toLowerCase().includes(keyword)
      );
    });
  }, [machines, viewMode, selectedLine, searchKeyword]);

  const selectedLineMachines = useMemo(() => {
    return machines.filter((machine) => machine.line === selectedLine);
  }, [machines, selectedLine]);

  const lineSummary = useMemo(() => {
    const running = selectedLineMachines.filter(
      (machine) => machine.status === "運轉中"
    ).length;
    const idle = selectedLineMachines.filter(
      (machine) => machine.status === "待機"
    ).length;
    const abnormal = selectedLineMachines.filter(
      (machine) => machine.status === "異常停止"
    ).length;
    const totalOutput = selectedLineMachines.reduce(
      (sum, machine) => sum + machine.output,
      0
    );
    const avgUtilization = selectedLineMachines.length
      ? Math.round(
          selectedLineMachines.reduce(
            (sum, machine) => sum + machine.utilization,
            0
          ) / selectedLineMachines.length
        )
      : 0;

    return {
      running,
      idle,
      abnormal,
      totalOutput,
      avgUtilization,
    };
  }, [selectedLineMachines]);

  const overallSummary = useMemo(() => {
    const running = machines.filter((m) => m.status === "運轉中").length;
    const idle = machines.filter((m) => m.status === "待機").length;
    const abnormal = machines.filter((m) => m.status === "異常停止").length;
    const totalOutput = machines.reduce((sum, m) => sum + m.output, 0);
    const avgUtilization = machines.length
      ? Math.round(
          machines.reduce((sum, m) => sum + m.utilization, 0) / machines.length
        )
      : 0;

    return {
      running,
      idle,
      abnormal,
      totalOutput,
      avgUtilization,
    };
  }, [machines]);

  const alertList = useMemo(() => {
    return machines
      .flatMap((machine) =>
        machine.alerts.map((alert) => ({
          ...alert,
          machineId: machine.machineId,
          machineName: machine.machineName,
          line: machine.line,
          status: machine.status,
        }))
      )
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 8);
  }, [machines]);

  const selectedMachineIndex = useMemo(() => {
    if (!selectedMachine) return -1;
    return machines.findIndex(
      (machine) => machine.machineId === selectedMachine.machineId
    );
  }, [machines, selectedMachine]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const simulationTimer = setInterval(() => {
      setMachines((prevMachines) =>
        prevMachines.map((machine) => {
          const random = Math.random();
          let nextStatus = machine.status;

          if (random < 0.08) {
            const statusPool = ["運轉中", "待機", "異常停止"];
            nextStatus =
              statusPool[Math.floor(Math.random() * statusPool.length)];
          }

          let output = machine.output;
          let utilization = machine.utilization;
          let reason = machine.reason;
          let alerts = [...machine.alerts];

          if (nextStatus === "運轉中") {
            output = output + Math.floor(Math.random() * 4);
            utilization = Math.min(
              96,
              utilization + Math.floor(Math.random() * 3)
            );
            reason = ["生產穩定進行中", "正常量產中", "加工節拍穩定"][
              Math.floor(Math.random() * 3)
            ];
          } else if (nextStatus === "待機") {
            utilization = Math.max(
              45,
              utilization - Math.floor(Math.random() * 3)
            );
            reason = ["等待下一批工單", "等待品檢完成", "等待換線作業"][
              Math.floor(Math.random() * 3)
            ];
          } else if (nextStatus === "異常停止") {
            utilization = Math.max(
              20,
              utilization - Math.floor(Math.random() * 4)
            );
            reason = ["刀具異常磨耗，設備停機中", "主軸負載過高，等待確認", "夾治具異常，暫停加工"][
              Math.floor(Math.random() * 3)
            ];

            if (Math.random() < 0.25) {
              const pickedAlert =
                alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
              alerts = [
                {
                  time: formatTime(new Date()),
                  code: pickedAlert.code,
                  message: pickedAlert.message,
                },
                ...alerts,
              ].slice(0, 5);
            }
          }

          return {
            ...machine,
            status: nextStatus,
            output,
            utilization,
            reason,
            alerts,
          };
        })
      );
    }, 3500);

    return () => clearInterval(simulationTimer);
  }, []);

  useEffect(() => {
    if (!selectedMachine) return;
    const latest = machines.find(
      (machine) => machine.machineId === selectedMachine.machineId
    );
    if (latest) {
      setSelectedMachine(latest);
    }
  }, [machines, selectedMachine]);

  const handleOpenMachine = (machine) => {
    setSelectedMachine(machine);
  };

  const handlePrevMachine = () => {
    if (selectedMachineIndex <= 0) {
      setSelectedMachine(machines[machines.length - 1]);
      return;
    }
    setSelectedMachine(machines[selectedMachineIndex - 1]);
  };

  const handleNextMachine = () => {
    if (
      selectedMachineIndex === -1 ||
      selectedMachineIndex === machines.length - 1
    ) {
      setSelectedMachine(machines[0]);
      return;
    }
    setSelectedMachine(machines[selectedMachineIndex + 1]);
  };

  const submitAI = (forcedQuestion) => {
    const question = (forcedQuestion ?? aiInput).trim();
    if (!question) return;

    const answer = generateAIResponse(question, machines, lines);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "assistant", text: answer },
    ]);

    setAiInput("");
  };

  const handleAIQuestion = (question) => {
    setAiInput(question);
    submitAI(question);
  };

  const displaySummary =
    viewMode === "factory" ? overallSummary : lineSummary;
  const displaySummaryTitle =
    viewMode === "factory" ? "整廠總覽" : `${selectedLine} 產線摘要`;

  return (
    <div style={styles.app} className="rwd-app">
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <header style={styles.header} className="rwd-header">
        <div style={styles.headerLeft}>
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>S</div>
            <div style={styles.titleWrap}>
              <h1 style={styles.title} className="rwd-title">
                SHINZAWA Smart Factory
              </h1>
              <div style={styles.subtitle}>震澤智慧工廠展示系統 v1.0</div>
            </div>
          </div>
        </div>

        <div style={styles.timeCard} className="rwd-time-card">
          <div style={styles.timeLabel}>系統時間</div>
          <div style={styles.timeValue}>{formatDateTime(now)}</div>
        </div>
      </header>

      <section style={styles.kpiGrid} className="rwd-kpi-grid">
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>總機台數</div>
          <div style={styles.kpiValue}>{machines.length}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>運轉中</div>
          <div style={styles.kpiValue}>{overallSummary.running}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>待機</div>
          <div style={styles.kpiValue}>{overallSummary.idle}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>異常停止</div>
          <div style={styles.kpiValue}>{overallSummary.abnormal}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>今日總產量</div>
          <div style={styles.kpiValue}>{overallSummary.totalOutput}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>平均稼動率</div>
          <div style={styles.kpiValue}>{overallSummary.avgUtilization}%</div>
        </div>
      </section>

      <section style={styles.mainLayout} className="rwd-main-layout">
        <div style={styles.leftArea} className="rwd-left-area">
          <div style={styles.panel} className="rwd-panel">
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle} className="rwd-panel-title">
                  3D 平面產線監控
                </h2>
                <div style={styles.panelDesc}>可切換整廠總覽與指定產線監控</div>
              </div>
            </div>

            <div style={styles.monitorToolbar} className="rwd-monitor-toolbar">
              <div style={styles.modeGroup} className="rwd-mode-group">
                <span style={styles.toolbarLabel}>監控模式</span>
                <button
                  style={
                    viewMode === "factory"
                      ? styles.activeModeButton
                      : styles.modeButton
                  }
                  onClick={() => setViewMode("factory")}
                >
                  整廠總覽
                </button>
                <button
                  style={
                    viewMode === "line"
                      ? styles.activeModeButton
                      : styles.modeButton
                  }
                  onClick={() => setViewMode("line")}
                >
                  依產線查看
                </button>
              </div>

              {viewMode === "line" && (
                <div style={styles.lineGroup} className="rwd-line-group">
                  <span style={styles.toolbarLabel}>選擇產線</span>
                  {lines.map((line) => (
                    <button
                      key={line}
                      style={
                        selectedLine === line
                          ? styles.activeLineButton
                          : styles.lineButton
                      }
                      onClick={() => setSelectedLine(line)}
                    >
                      {line}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.lineSummaryCard}>
              <div style={styles.lineSummaryTitle}>{displaySummaryTitle}</div>
              <div style={styles.lineSummaryGrid} className="rwd-line-summary-grid">
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>運轉中</div>
                  <div style={styles.summaryValue}>{displaySummary.running} 台</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>待機</div>
                  <div style={styles.summaryValue}>{displaySummary.idle} 台</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>異常停止</div>
                  <div style={styles.summaryValue}>{displaySummary.abnormal} 台</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>今日產量</div>
                  <div style={styles.summaryValue}>{displaySummary.totalOutput} 件</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>平均稼動率</div>
                  <div style={styles.summaryValue}>{displaySummary.avgUtilization}%</div>
                </div>
              </div>
            </div>

            <div style={styles.searchRow}>
              <input
                style={styles.searchInput}
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜尋機台 / 人員 / 產線 / 程式名稱"
              />
            </div>

            <div style={styles.factoryMap}>
              {viewMode === "factory" ? (
                lines.map((line) => {
                  const lineMachines = filteredMachines.filter(
                    (machine) => machine.line === line
                  );

                  if (lineMachines.length === 0) return null;

                  return (
                    <div key={line} style={styles.lineSection}>
                      <div style={styles.lineSectionHeader}>
                        <div style={styles.lineSectionTitle}>{line}</div>
                        <div style={styles.lineSectionCount}>
                          {lineMachines.length} 台設備
                        </div>
                      </div>

                      <div style={styles.machineGrid} className="rwd-machine-grid">
                        {lineMachines.map((machine) => (
                          <MachineCard
                            key={machine.machineId}
                            machine={machine}
                            onClick={() => handleOpenMachine(machine)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={styles.lineSection}>
                  <div style={styles.lineSectionHeader}>
                    <div style={styles.lineSectionTitle}>{selectedLine}</div>
                    <div style={styles.lineSectionCount}>
                      {filteredMachines.length} 台設備
                    </div>
                  </div>

                  <div style={styles.machineGrid} className="rwd-machine-grid">
                    {filteredMachines.map((machine) => (
                      <MachineCard
                        key={machine.machineId}
                        machine={machine}
                        onClick={() => handleOpenMachine(machine)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredMachines.length === 0 && (
                <div style={styles.emptyState}>查無符合條件的機台資料</div>
              )}
            </div>
          </div>

          <div style={styles.panel} className="rwd-panel">
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle} className="rwd-panel-title">
                  設備列表
                </h2>
                <div style={styles.panelDesc}>點選設備可查看詳細狀態、生產資訊與警報</div>
              </div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table} className="rwd-table">
                <thead>
                  <tr>
                    <th style={styles.th}>機台</th>
                    <th style={styles.th}>當責人員</th>
                    <th style={styles.th}>產線</th>
                    <th style={styles.th}>狀態</th>
                    <th style={styles.th}>今日產量</th>
                    <th style={styles.th}>稼動率</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => (
                    <tr
                      key={machine.machineId}
                      style={styles.tr}
                      onClick={() => handleOpenMachine(machine)}
                    >
                      <td style={styles.td}>{machine.machineId}</td>
                      <td style={styles.td}>{machine.owner}</td>
                      <td style={styles.td}>{machine.line}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: `${statusColorMap[machine.status]}22`,
                            color: statusColorMap[machine.status],
                            borderColor: `${statusColorMap[machine.status]}66`,
                          }}
                        >
                          {machine.status}
                        </span>
                      </td>
                      <td style={styles.td}>{machine.output}</td>
                      <td style={styles.td}>{machine.utilization}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={styles.rightArea} className="rwd-right-area">
          <div style={styles.panel} className="rwd-panel">
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle} className="rwd-panel-title">
                  AI 工廠助理
                </h2>
                <div style={styles.panelDesc}>支援產線摘要、機台狀態、產量與異常查詢</div>
              </div>
            </div>

            <div style={styles.suggestionWrap}>
              {suggestionQuestions.map((question) => (
                <button
                  key={question}
                  style={styles.suggestionButton}
                  onClick={() => handleAIQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>

            <div style={styles.chatBox}>
              {chatHistory.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  style={{
                    ...styles.chatBubble,
                    ...(item.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble),
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>

            <div style={styles.chatInputRow} className="rwd-chat-input-row">
              <input
                style={styles.chatInput}
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="例如：NV-8 狀態？、哪台產量最高？"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAI();
                }}
              />
              <button style={styles.sendButton} className="rwd-send-button" onClick={() => submitAI()}>
                送出
              </button>
            </div>
          </div>

          <div style={styles.panel} className="rwd-panel">
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle} className="rwd-panel-title">
                  即時警報列表
                </h2>
                <div style={styles.panelDesc}>顯示最新警報與提醒資訊</div>
              </div>
            </div>

            <div style={styles.alertFeed}>
              {alertList.length > 0 ? (
                alertList.map((alert, index) => (
                  <div
                    key={`${alert.machineId}-${alert.code}-${index}`}
                    style={styles.alertFeedItem}
                  >
                    <div style={styles.alertFeedTop}>
                      <span style={styles.alertFeedMachine}>{alert.machineId}</span>
                      <span style={styles.alertFeedTime}>{alert.time}</span>
                    </div>
                    <div style={styles.alertFeedMeta}>
                      <span style={styles.alertFeedLine}>{alert.line}</span>
                      <span style={styles.alertFeedCode}>{alert.code}</span>
                    </div>
                    <div style={styles.alertFeedMessage}>{alert.message}</div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>目前無警報資料</div>
              )}
            </div>
          </div>

          <div style={styles.panel} className="rwd-panel">
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle} className="rwd-panel-title">
                  導入路徑
                </h2>
                <div style={styles.panelDesc}>展示型 Demo 可延伸至真實工廠資料串接</div>
              </div>
            </div>

            <div style={styles.roadmap}>
              <div style={styles.roadmapItem}>
                <div style={styles.roadmapStep}>A</div>
                <div>
                  <div style={styles.roadmapTitle}>展示版</div>
                  <div style={styles.roadmapText}>建立品牌化智慧工廠畫面與可視化監控介面。</div>
                </div>
              </div>
              <div style={styles.roadmapItem}>
                <div style={styles.roadmapStep}>B</div>
                <div>
                  <div style={styles.roadmapTitle}>模擬互動版</div>
                  <div style={styles.roadmapText}>加入模擬即時資料、AI 助理與單機詳細資訊。</div>
                </div>
              </div>
              <div style={styles.roadmapItem}>
                <div style={styles.roadmapStep}>C</div>
                <div>
                  <div style={styles.roadmapTitle}>實際串接版</div>
                  <div style={styles.roadmapText}>未來可接 CNC / PLC / OPC UA / MES 等真實系統資料。</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedMachine && (
        <div style={styles.modalOverlay} onClick={() => setSelectedMachine(null)}>
          <div
            style={styles.modalContent}
            className="rwd-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle} className="rwd-modal-title">
                  {selectedMachine.machineId}
                </h2>
                <div style={styles.modalSubtitle}>
                  {selectedMachine.line} ｜ {selectedMachine.status} ｜ 當責人員{" "}
                  {selectedMachine.owner}
                </div>
              </div>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedMachine(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalActionRow} className="rwd-modal-action-row">
              <input
                style={styles.modalSearchInput}
                type="text"
                placeholder="輸入機台型號，例如 NV-8"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const keyword = e.currentTarget.value.trim().toLowerCase();
                  const found = machines.find(
                    (machine) => machine.machineId.toLowerCase() === keyword
                  );
                  if (found) setSelectedMachine(found);
                }}
              />
              <div style={styles.modalNavButtons}>
                <button style={styles.modalNavButton} onClick={handlePrevMachine}>
                  上一台
                </button>
                <button style={styles.modalNavButton} onClick={handleNextMachine}>
                  下一台
                </button>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>設備狀態</div>
              <div style={styles.detailGrid} className="rwd-detail-grid">
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>機台</div>
                  <div style={styles.detailValue}>{selectedMachine.machineId}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>產線</div>
                  <div style={styles.detailValue}>{selectedMachine.line}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>狀態</div>
                  <div
                    style={{
                      ...styles.detailValue,
                      color: statusColorMap[selectedMachine.status],
                      fontWeight: 700,
                    }}
                  >
                    {selectedMachine.status}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>今日產量</div>
                  <div style={styles.detailValue}>{selectedMachine.output} 件</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>稼動率</div>
                  <div style={styles.detailValue}>{selectedMachine.utilization}%</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>完工時間</div>
                  <div style={styles.detailValue}>{selectedMachine.completionTime}</div>
                </div>
                <div style={styles.detailItemFull}>
                  <div style={styles.detailLabel}>狀態說明</div>
                  <div style={styles.detailValue}>{selectedMachine.reason}</div>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>目前生產資訊</div>
              <div style={styles.detailGrid} className="rwd-detail-grid">
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>當責人員</div>
                  <div style={styles.detailValue}>{selectedMachine.owner}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>程式名稱</div>
                  <div style={styles.detailValue}>{selectedMachine.programName}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>機台暱稱</div>
                  <div style={styles.detailValue}>{selectedMachine.machineName}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>目前生產工件</div>
                  <div style={styles.detailValue}>{selectedMachine.currentPart}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>生產起始時間</div>
                  <div style={styles.detailValue}>{selectedMachine.productionStartTime}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>生產數量</div>
                  <div style={styles.detailValue}>{selectedMachine.productionQty} 件</div>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>最近警報明細</div>
              <div style={styles.alertList}>
                {selectedMachine.alerts.length > 0 ? (
                  selectedMachine.alerts.map((alert, index) => (
                    <div
                      key={`${alert.code}-${index}`}
                      style={styles.alertItem}
                      className="rwd-alert-item"
                    >
                      <div style={styles.alertTime}>{alert.time}</div>
                      <div style={styles.alertCode}>{alert.code}</div>
                      <div style={styles.alertMessage}>{alert.message}</div>
                    </div>
                  ))
                ) : (
                  <div style={styles.noAlertText}>目前無警報紀錄</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WrappedApp;