/*
 * Copyright (c) 2024 Veikka Hongisto
 * This code is free to use as long as this copyright notice is kept in the code.
 */
class SkillTree {
  constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.skills = [];
      this.connections = [];
      this.gridSize = 20;
      this.selectedSkill = null;
      this.draggedSkill = null;
      this.creatingConnection = false;
      this.connectionStart = null;

      this.history = [];
      this.historyIndex = -1;

      this.offsetX = 0;
      this.offsetY = 0;
      this.scale = 1;
      this.isDragging = false;
      this.lastX = 0;
      this.lastY = 0;

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
      this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

      this.draw();
  }

  resizeCanvas() {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
      this.draw();
  }

  handleWheel(e) {
      e.preventDefault();
      const delta = e.deltaY;
      const scaleChange = delta > 0 ? 0.9 : 1.1;
      const mouseX = e.clientX - this.canvas.getBoundingClientRect().left;
      const mouseY = e.clientY - this.canvas.getBoundingClientRect().top;

      this.offsetX = mouseX - (mouseX - this.offsetX) * scaleChange;
      this.offsetY = mouseY - (mouseY - this.offsetY) * scaleChange;
      this.scale *= scaleChange;

      this.draw();
  }

  handleMouseDown(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offsetX) / this.scale;
      const y = (e.clientY - rect.top - this.offsetY) / this.scale;

      const clickedSkillIndex = this.getSkillAtPosition(x, y);

      if (clickedSkillIndex !== -1) {
          if (this.creatingConnection) {
              this.finishConnection(this.skills[clickedSkillIndex]);
          } else {
              this.draggedSkill = this.skills[clickedSkillIndex];
              this.canvas.style.cursor = 'grabbing';
          }
      } else {
          this.isDragging = true;
          this.lastX = e.clientX;
          this.lastY = e.clientY;
          this.canvas.style.cursor = 'move';
      }
  }

  handleMouseMove(e) {
      if (this.draggedSkill) {
          const rect = this.canvas.getBoundingClientRect();
          this.draggedSkill.x = this.snapToGrid((e.clientX - rect.left - this.offsetX) / this.scale);
          this.draggedSkill.y = this.snapToGrid((e.clientY - rect.top - this.offsetY) / this.scale);
          this.draw();
      } else if (this.isDragging) {
          const dx = e.clientX - this.lastX;
          const dy = e.clientY - this.lastY;
          this.offsetX += dx;
          this.offsetY += dy;
          this.lastX = e.clientX;
          this.lastY = e.clientY;
          this.draw();
      }
  }

  handleMouseUp(e) {
      if (this.draggedSkill) {
          const rect = this.canvas.getBoundingClientRect();
          const x = (e.clientX - rect.left - this.offsetX) / this.scale;
          const y = (e.clientY - rect.top - this.offsetY) / this.scale;

          this.draggedSkill.x = this.snapToGrid(x);
          this.draggedSkill.y = this.snapToGrid(y);

          this.canvas.style.cursor = 'default';
          this.draggedSkill = null;
          this.saveState();
          this.draw();
      } else if (this.isDragging) {
          this.isDragging = false;
          this.canvas.style.cursor = 'default';
      }
  }

  addSkill(x, y, type) {
      const skill = {
          x: this.snapToGrid((x - this.offsetX) / this.scale),
          y: this.snapToGrid((y - this.offsetY) / this.scale),
          radius: 50,
          type: type,
          name: `New ${type} Skill`,
          cost: 0,
          level: 1,
          unlocked: false,
          groupId: null
      };
      this.skills.push(skill);
      this.saveState();
      this.draw();
  }

  deleteSkill(skill) {
      const index = this.skills.findIndex(s => s === skill);
      if (index !== -1) {
          this.skills.splice(index, 1);
          this.connections = this.connections.filter(conn => conn.start !== skill && conn.end !== skill);
          this.closeSkillEditor();
          this.saveState();
          this.draw();
      }
  }

  snapToGrid(value) {
      return Math.round(value / this.gridSize) * this.gridSize;
  }

  draw() {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.scale, this.scale);

      this.drawGrid();
      this.drawConnections();
      this.drawSkills();

      this.ctx.restore();
  }

  drawGrid() {
      this.ctx.strokeStyle = 'rgba(238, 238, 238, 0.1)';
      this.ctx.lineWidth = 0.5;

      const startX = Math.floor(-this.offsetX / this.scale / this.gridSize) * this.gridSize;
      const startY = Math.floor(-this.offsetY / this.scale / this.gridSize) * this.gridSize;
      const endX = Math.ceil((this.canvas.width - this.offsetX) / this.scale / this.gridSize) * this.gridSize;
      const endY = Math.ceil((this.canvas.height - this.offsetY) / this.scale / this.gridSize) * this.gridSize;

      for (let x = startX; x < endX; x += this.gridSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, startY);
          this.ctx.lineTo(x, endY);
          this.ctx.stroke();
      }

      for (let y = startY; y < endY; y += this.gridSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(startX, y);
          this.ctx.lineTo(endX, y);
          this.ctx.stroke();
      }
  }

  drawConnections() {
    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    const groupedSkills = {};
    this.skills.forEach(skill => {
        if (skill.groupId) {
            const groupIds = skill.groupId.split(' ');
            groupIds.forEach(groupId => {
                if (!groupedSkills[groupId]) {
                    groupedSkills[groupId] = [];
                }
                groupedSkills[groupId].push(skill);
            });
        }
    });
    for (const groupId in groupedSkills) {
        const skills = groupedSkills[groupId];
        for (let i = 0; i < skills.length - 1; i++) {
            for (let j = i + 1; j < skills.length; j++) {
                this.ctx.beginPath();
                this.ctx.moveTo(skills[i].x, skills[i].y);
                this.ctx.lineTo(skills[j].x, skills[j].y);
                this.ctx.stroke();
                // Draw black outline
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 6;
                this.ctx.globalCompositeOperation = 'destination-over';
                this.ctx.stroke();
                // Reset for next line
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 4;
                this.ctx.globalCompositeOperation = 'source-over';
            }
        }
    }
    this.ctx.restore();
  }
  
  drawSkills() {
      for (const skill of this.skills) {
          this.ctx.beginPath();
          this.ctx.arc(skill.x, skill.y, skill.radius, 0, 2 * Math.PI);

          // Create gradient for background
          const gradient = this.ctx.createRadialGradient(skill.x, skill.y, 0, skill.x, skill.y, skill.radius);
          gradient.addColorStop(0, skill.type === 'basic' ? 'rgba(58, 123, 213, 0.9)' : 
                                   skill.type === 'advanced' ? 'rgba(0, 176, 155, 0.9)' : 
                                   'rgba(211, 149, 155, 0.9)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

          this.ctx.fillStyle = gradient;
          this.ctx.fill();

          // Draw border
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx.lineWidth = 3;
          this.ctx.stroke();

          // Draw skill name
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 16px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          this.ctx.shadowBlur = 4;
          this.ctx.fillText(skill.name, skill.x, skill.y);
          this.ctx.shadowBlur = 0;
      }
  }

  getSkillAtPosition(x, y) {
      return this.skills.findIndex(skill =>
          Math.sqrt((x - skill.x) ** 2 + (y - skill.y) ** 2) <= skill.radius
      );
  }

  openSkillEditor(skill) {
      const editor = document.getElementById('skill-editor');
      const nameInput = document.getElementById('skill-name');
      const costInput = document.getElementById('skill-cost');
      const levelInput = document.getElementById('skill-level');
      const unlockedInput = document.getElementById('skill-unlocked');
      const groupIdInput = document.getElementById('skill-group-id');

      nameInput.value = skill.name;
      costInput.value = skill.cost;
      levelInput.value = skill.level;
      unlockedInput.checked = skill.unlocked;
      groupIdInput.value = skill.groupId || '';

      editor.classList.remove('hidden');

      const event = new CustomEvent('skillEditorOpened');
      document.dispatchEvent(event);

      document.getElementById('save-skill').onclick = () => this.saveSkillChanges(skill);
      document.getElementById('cancel-edit').onclick = () => this.closeSkillEditor();
      document.getElementById('delete-skill').onclick = () => this.deleteSkill(skill);
  }

  saveSkillChanges(skill) {
    skill.name = document.getElementById('skill-name').value;
    skill.cost = parseInt(document.getElementById('skill-cost').value);
    skill.level = parseInt(document.getElementById('skill-level').value);
    skill.unlocked = document.getElementById('skill-unlocked').checked;
    skill.groupId = document.getElementById('skill-group-id').value.trim() || null;
    this.closeSkillEditor();
    this.saveState();
    this.draw();
  }



  closeSkillEditor() {
      document.getElementById('skill-editor').classList.add('hidden');
  }

  exportJSON() {
      return JSON.stringify({
          skills: this.skills,
          connections: this.connections
      });
  }

  saveState() {
      const state = JSON.stringify({
          skills: this.skills,
          connections: this.connections
      });

      if (this.historyIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.historyIndex + 1);
      }

      this.history.push(state);
      this.historyIndex++;
  }

  undo() {
      if (this.historyIndex > 0) {
          this.historyIndex--;
          this.loadState(this.history[this.historyIndex]);
      }
  }

  redo() {
      if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.loadState(this.history[this.historyIndex]);
      }
  }

  loadState(state) {
      const parsedState = JSON.parse(state);
      this.skills = parsedState.skills;
      this.connections = parsedState.connections;
      this.draw();
  }

  importJSON(jsonData) {
      try {
          const data = JSON.parse(jsonData);
          this.skills = data.skills;
          this.connections = data.connections;
          this.saveState();
          this.draw();
      } catch (error) {
          console.error('Error importing JSON:', error);
      }
  }
}

const skillTree = new SkillTree('skill-tree-canvas');

document.getElementById('export-btn').addEventListener('click', () => {
  const jsonData = skillTree.exportJSON();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'skill_tree.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('skill-tree-canvas').addEventListener('dblclick', (e) => {
  const rect = skillTree.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedSkillIndex = skillTree.getSkillAtPosition((x - skillTree.offsetX) / skillTree.scale, (y - skillTree.offsetY) / skillTree.scale);

  if (clickedSkillIndex !== -1) {
      skillTree.openSkillEditor(skillTree.skills[clickedSkillIndex]);
  }
});

document.getElementById('undo-btn').addEventListener('click', () => {
  skillTree.undo();
});

document.getElementById('redo-btn').addEventListener('click', () => {
  skillTree.redo();
});

document.getElementById('import-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
          skillTree.importJSON(event.target.result);
      };
      reader.readAsText(file);
  }
});
