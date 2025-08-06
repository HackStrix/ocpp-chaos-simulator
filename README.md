# OCPP Chaos Simulator: A Chaos Monkey for EV Charging Networks

**OCPP Chaos Simulator** is a powerful test suite for validating the robustness and scalability of EV Charging Station Management Systems (CSMS). Inspired by Chaos Engineering and Netflix Chaos Monkey, this tool goes beyond standard compliance checks to deliberately inject failure into your testing environment.

It allows you to simulate hundreds of chargers, run complex scenarios, and introduce real-world problems like network loss, corrupted data, and out-of-order messages—all from a user-friendly web interface.

---

## 🚀 Core Features

- **Scenario-Based Testing**  
  Define complex test flows using simple YAML or JSON files. Simulate everything from a basic charge cycle to intricate multi-charger interactions.

- **Chaos Engineering**  
  Deliberately inject faults to test your system's resilience.

- **3G/4G Signal Loss**  
  Simulate chargers going offline and test your CSMS's reconnection and data-buffering logic.

- **Corrupted Messages**  
  Send malformed OCPP packets to ensure your server handles errors gracefully.

- **Out-of-Order Messages**  
  Test your system's state management by sending messages in an incorrect sequence.

- **Load Testing**  
  Easily spin up hundreds of virtual chargers to understand how your CSMS performs under heavy, concurrent load.

- **Interactive Web UI**  
  A real-time dashboard to launch scenarios, monitor the status of every virtual charger, and view live OCPP message logs.

- **Extensible Protocol Support**  
  Designed to support OCPP 1.6-J and 2.0.1, with the flexibility to add future versions.

> _(A visual of the simulator's dashboard, showing live status and logs)_

---

## 💡 Why Use OCPP Chaos Simulator?

In the real world, networks are unreliable, hardware fails, and messages get lost. A CSMS that works perfectly in a lab can fail under the unpredictable conditions of a live environment.

This simulator helps you:

- **Build Confidence**: Proactively find and fix weaknesses in your CSMS before they affect real customers.
- **Accelerate Development**: Automate regression and resilience testing, freeing up your QA team to focus on exploratory testing.
- **Validate Scalability**: Ensure your infrastructure can handle the load as your charging network grows.
- **Prevent Vendor Lock-In**: Test your system against a standardized, open-source simulator.

---

## 🛠 Technology Stack

- **Backend & Core Engine**: [GoLang](https://go.dev/) for high-performance, concurrent simulations.
- **Frontend (UI)**: React / Vue.js (Subject to change) for a dynamic and responsive web dashboard.
- **Communication**: WebSockets for both OCPP messaging and real-time UI updates.
- **Scenario Definition**: YAML for human-readable test case creation.
- **Deployment**: Docker & Docker Compose for easy, one-command setup.

---

## ⚙️ Getting Started

> _(This section will be updated as the project is built)_

## 🗺 Project Roadmap
This project will be developed in phases to deliver value incrementally.

Phase 1: The Core Engine
Build the fundamental OCPP client and simulation engine.

Phase 2: Dynamic Scenarios
Implement the YAML-based scenario manager and test runner.

Phase 3: The Vehicle (vEV)
Add a virtual EV module to simulate battery models and Plug & Charge (ISO 15118).

Phase 4: The UI
Develop the full-featured web dashboard for visualization and control.

Phase 5: Advanced Chaos & Scaling
Optimize for massive load testing and integrate with CI/CD pipelines.

🤝 Contributing
Contributions are welcome! Whether you're a developer, a QA engineer, or an e-mobility enthusiast, you can help by submitting bug reports, suggesting features, or creating pull requests.
Please see our `CONTRIBUTING.md` file for details.

📄 License
This project is licensed under the GNU AGPL v3 – see the `LICENSE.md` file for details.
