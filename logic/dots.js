const grid = document.getElementById("grid");
        const clearButton = document.getElementById("clearButton");
        let selectedDots = [];
        let isDrawing = false;
        let lines = [];
        
        // Create dots with staggered animation
        for (let i = 0; i < 64; i++) {
            let dot = document.createElement("div");
            dot.className = "dot";
            dot.dataset.index = i;
            dot.style.opacity = "0";
            grid.appendChild(dot);
            
            // Staggered appearance
            setTimeout(() => {
                dot.style.transition = "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.5s ease";
                dot.style.opacity = "1";
            }, i * 10);
            
            dot.addEventListener("mousedown", function(e) {
                e.preventDefault(); // Prevent text selection
                isDrawing = true;
                selectedDots = [dot];
                dot.classList.add("active");
                
                // Add haptic-like feedback with subtle animation
                dot.style.transform = "scale(1.6)";
                setTimeout(() => {
                    if (dot.classList.contains("active")) {
                        dot.style.transform = "scale(1.5)";
                    }
                }, 100);
            });
            
            dot.addEventListener("mouseenter", function() {
                if (isDrawing && !selectedDots.includes(dot)) {
                    dot.classList.add("active");
                    selectedDots.push(dot);
                    if (selectedDots.length > 1) {
                        let line = connectDots(selectedDots[selectedDots.length - 2], dot);
                        lines.push(line);
                    }
                }
            });
        }
        
        document.addEventListener("mouseup", function() {
            if (isDrawing) {
                isDrawing = false;
                document.querySelectorAll(".dot.active").forEach(d => {
                    d.classList.remove("active");
                    d.style.transform = "";
                });
            }
        });
        
        document.addEventListener("mouseleave", function() {
            if (isDrawing) {
                isDrawing = false;
                document.querySelectorAll(".dot.active").forEach(d => {
                    d.classList.remove("active");
                    d.style.transform = "";
                });
            }
        });
        
        clearButton.addEventListener("click", function() {
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "";
            }, 100);
            
            clearAllLines();
        });
        
        function connectDots(dot1, dot2) {
            const rect1 = dot1.getBoundingClientRect();
            const rect2 = dot2.getBoundingClientRect();
            const x1 = rect1.left + rect1.width / 2;
            const y1 = rect1.top + rect1.height / 2;
            const x2 = rect2.left + rect2.width / 2;
            const y2 = rect2.top + rect2.height / 2;
            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
            
            const line = document.createElement("div");
            line.className = "line";
            line.style.width = "0px";
            line.style.transform = `rotate(${angle}deg)`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1}px`;
            line.style.opacity = "0";
            document.body.appendChild(line);
            
            // Force reflow for animation
            line.getBoundingClientRect();
            
            // Animate line appearance
            line.style.width = `${length}px`;
            line.style.opacity = "1";
            
            return line;
        }
        
        function clearAllLines() {
            const allLines = document.querySelectorAll(".line");
            allLines.forEach((line, index) => {
                // Staggered disappearance
                setTimeout(() => {
                    line.style.opacity = "0";
                    setTimeout(() => line.remove(), 300);
                }, index * 30);
            });
            lines = [];
        }
        
        // Add some "premium feel" features
        grid.addEventListener("mousemove", function(e) {
            // Subtle tilt effect based on mouse position
            const bounds = this.getBoundingClientRect();
            const x = e.clientX - bounds.left - bounds.width / 2;
            const y = e.clientY - bounds.top - bounds.height / 2;
            const tiltX = y / 30;
            const tiltY = -x / 30;
            
            this.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
        });
        
        grid.addEventListener("mouseleave", function() {
            // Reset tilt when mouse leaves
            this.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
            this.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(-5px)";
        });