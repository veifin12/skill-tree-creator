/*
 * Copyright (c) 2024 Veikka Hongisto
 * This code is free to use as long as this copyright notice is kept in the code.
 */
document.addEventListener('DOMContentLoaded', () => {
    const skillTemplates = document.querySelectorAll('#skill-templates .skill-node');
    const canvas = document.getElementById('skill-tree-canvas');
    const sidebar = document.getElementById('sidebar');

    skillTemplates.forEach(template => {
        template.addEventListener('dragstart', dragStart);
    });

    canvas.addEventListener('dragover', dragOver);
    canvas.addEventListener('drop', drop);
    sidebar.addEventListener('dragover', dragOver);
    sidebar.addEventListener('drop', dropOnSidebar);

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const skillType = e.dataTransfer.getData('text');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (typeof skillTree !== 'undefined' && skillTree.addSkill) {
            skillTree.addSkill(x, y, skillType);
        } else {
            console.error('skillTree is not defined or addSkill method is missing');
        }
    }

    function dropOnSidebar(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (typeof skillTree !== 'undefined' && skillTree.deleteSkillAt) {
            skillTree.deleteSkillAt(x, y);
        } else {
            console.error('skillTree is not defined or deleteSkillAt method is missing');
        }
    }
});
