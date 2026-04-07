// time dropdown
const hour = document.getElementById("hour");
const minute = document.getElementById("minute");
for (let h=0; h<24; h++) hour.innerHTML += `<option value="${h}">${h}</option>`;
for (let m=0; m<60; m+=5) minute.innerHTML += `<option value="${m}">${m.toString().padStart(2,'0')}</option>`;

// state
let selectedDate=null;
let currentYear=new Date().getFullYear();
let currentMonth=new Date().getMonth();
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// month dropdown
const monthSelect = document.getElementById("monthSelect");
for (let i=0;i<12;i++){
    let o=document.createElement("option");
    o.value=i; o.textContent=monthLabels[i];
    if(i===currentMonth) o.selected=true;
    monthSelect.appendChild(o);
}

monthSelect.onchange=()=>{
    currentMonth=parseInt(monthSelect.value);
    generateCalendar();
};


// calendar
const calendarWeekdays = document.getElementById("calendarWeekdays");
const weekdayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
calendarWeekdays.innerHTML = weekdayLabels
    .map((label) => `<div class="weekday">${label}</div>`)
    .join("");

const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
function generateCalendar(){
    calendar.innerHTML="";
    monthTitle.textContent=`${currentYear} / ${monthLabels[currentMonth]}`;

    let first=new Date(currentYear,currentMonth,1).getDay();
    let last=new Date(currentYear,currentMonth+1,0).getDate();
    let data=JSON.parse(localStorage.getItem("logs")||"{}");

    for(let i=0;i<first;i++) calendar.innerHTML+="<div></div>";

    for(let d=1;d<=last;d++){
        let key=`${currentYear}-${currentMonth+1}-${d}`;
        let div=document.createElement("div");
        div.className="day";
        div.textContent=d;

        if(currentMonth===3 && d===20){
            div.classList.add("special-day");
        }

        if(data[key]){
            let weed=0, water=0;

            data[key].forEach(r=>{
                if(r.type==="weed") weed+=Number(r.count);
                if(r.type==="water") water+=Number(r.count);
            });

            if(weed>0 || water>0){
                div.classList.add("has-record");

                let badge=document.createElement("div");
                badge.className="count-badge";
                badge.innerHTML=`
                <span class="weed">${weed}</span><br>
                <span class="water">${water}</span>
                `;
                div.appendChild(badge);
            }
        }

        div.onclick=()=>selectDate(key,div);
        calendar.appendChild(div);
    }
}

// select
const selectedDateText = document.getElementById("selectedDate");
function selectDate(date,el){
    document.querySelectorAll(".day").forEach(d=>d.classList.remove("selected"));
    el.classList.add("selected");

    selectedDate=date;
    selectedDateText.textContent=date;
    loadRecords();
}

// save
const type = document.getElementById("type");
const count = document.getElementById("count");
function saveRecord(){
    if(!selectedDate){alert("Select a date");return;}

    let data=JSON.parse(localStorage.getItem("logs")||"{}");
    if(!data[selectedDate]) data[selectedDate]=[];

    let time=`${hour.value}:${minute.value.padStart(2,'0')}`;

    data[selectedDate].push({
        type:type.value,
        time,
        count:count.value
    });

    localStorage.setItem("logs",JSON.stringify(data));

    loadRecords();
    generateCalendar();
    updateTimers();
}

// delete
function deleteRecord(i){
    let data=JSON.parse(localStorage.getItem("logs")||"{}");

    data[selectedDate].splice(i,1);

    if(data[selectedDate].length===0){
        delete data[selectedDate];
    }

    localStorage.setItem("logs",JSON.stringify(data));

    loadRecords();
    generateCalendar();
    updateTimers();
}

// records
const records = document.getElementById("records");
const weeklySummary = document.getElementById("weeklySummary");

function getStartOfWeek(date){
    let start = new Date(date);
    start.setHours(0,0,0,0);
    start.setDate(start.getDate() - start.getDay());
    return start;
}

function updateWeeklySummary(){
    let data=JSON.parse(localStorage.getItem("logs")||"{}");
    let now = new Date();
    let weekStart = getStartOfWeek(now);
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let weedTotal = 0;
    let waterTotal = 0;

    for(let d in data){
        let [y,m,day]=d.split("-").map(Number);
        let current = new Date(y,m-1,day);
        current.setHours(0,0,0,0);

        if(current >= weekStart && current < weekEnd){
            data[d].forEach(r=>{
                let amount = Number(r.count) || 0;
                if(r.type === "weed") weedTotal += amount;
                if(r.type === "water") waterTotal += amount;
            });
        }
    }

    weeklySummary.innerHTML = `This week <span class="weed">🌿 ${weedTotal}</span> <span class="water">💧 ${waterTotal}</span>`;
}

function loadRecords(){
    records.innerHTML="";
    updateWeeklySummary();
    let data=JSON.parse(localStorage.getItem("logs")||"{}");
    let list=data[selectedDate]||[];

    list.forEach((r,i)=>{
        let icon = r.type==="weed" ? "🌿" : "💧";

        let el=document.createElement("div");
        el.className="record";
        el.innerHTML=`
        <span>${icon} ${r.time} - ${r.count}</span>
        <span class="delete" onclick="deleteRecord(${i})">❌</span>
        `;
        records.appendChild(el);
    });
}

// last time
function getLast(type){
    let data=JSON.parse(localStorage.getItem("logs")||"{}");
    let latest=null;

    for(let d in data){
        data[d].forEach(r=>{
            if(r.type===type){
                let [y,m,day]=d.split("-").map(Number);
                let [h,min]=r.time.split(":").map(Number);
                let dt=new Date(y,m-1,day,h,min);
                if(!latest||dt>latest) latest=dt;
            }
        });
    }
    return latest;
}

// timers
function updateTimers(){
    updateTimer("weed","weedTimer","🌿");
    updateTimer("water","waterTimer","💧");
}

function formatUnit(value, singular, plural){
    return `<span class="timer-number">${value}</span> ${value === 1 ? singular : plural}`;
}

function formatDurationWords(totalMinutes){
    if(totalMinutes <= 0) return `${formatUnit(0, "minute", "minutes")}`;

    let days = Math.floor(totalMinutes / (60 * 24));
    let hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    let minutes = totalMinutes % 60;
    let parts = [];

    if(days) parts.push(formatUnit(days, "day", "days"));
    if(hours) parts.push(formatUnit(hours, "hour", "hours"));
    if(minutes || parts.length === 0) parts.push(formatUnit(minutes, "minute", "minutes"));

    return parts.join(" ");
}

function formatTargetLabel(totalMinutes){
    if(totalMinutes % (60 * 24) === 0){
        let days = totalMinutes / (60 * 24);
        return formatUnit(days, "day", "days");
    }

    let hours = Math.floor(totalMinutes / 60);
    return formatUnit(hours, "hour", "hours");
}

function getNextTargetMinutes(elapsedMinutes){
    const fixedTargets = [6 * 60, 12 * 60, 18 * 60];

    for (const target of fixedTargets) {
        if (elapsedMinutes < target) return target;
    }

    return Math.floor(elapsedMinutes / (24 * 60) + 1) * 24 * 60;
}

function updateTimer(type,id,icon){
    let el=document.getElementById(id);
    let last=getLast(type);

    if(!last){
        el.textContent=`${icon} No records`;
        el.classList.add("no-records");
        return;
    }
    
    el.classList.remove("no-records");

    let elapsedMinutes=Math.floor((new Date()-last)/(1000*60));
    let targetMinutes=getNextTargetMinutes(elapsedMinutes);
    let remainingMinutes=targetMinutes-elapsedMinutes;
    let targetText=formatTargetLabel(targetMinutes);

    el.innerHTML=`${icon} ${formatDurationWords(remainingMinutes)} remaining to reach ${targetText}`;
}
setInterval(updateTimers,1000);

// 🌗 theme toggle
const toggle = document.getElementById("themeToggle");

if(localStorage.getItem("theme")==="dark"){
    document.documentElement.classList.add("dark");
    toggle.textContent="🌞";
}

toggle.onclick=()=>{
    document.documentElement.classList.toggle("dark");

    if(document.documentElement.classList.contains("dark")){
        localStorage.setItem("theme","dark");
        toggle.textContent="☀";
    }else{
        localStorage.setItem("theme","light");
        toggle.textContent="☾";
    }
};

// 👤 Account View Toggle
const mainPage = document.getElementById("mainPage");
const accountPage = document.getElementById("accountPage");
const accountToggle = document.getElementById("accountToggle");

function toggleAccountView() {
    if (accountPage.style.display === "none" || accountPage.style.display === "") {
        accountPage.style.display = "block";
        mainPage.style.display = "none";
        loadAccountInfo();
    } else {
        accountPage.style.display = "none";
        mainPage.style.display = "block";
    }
}

accountToggle.onclick = toggleAccountView;

// Save/Load Account Info
function saveAccountInfo() {
    const info = {
        name: document.getElementById("accName").value,
        email: document.getElementById("accEmail").value
    };
    localStorage.setItem("accountInfo", JSON.stringify(info));
    alert("Profile saved!");
}

function loadAccountInfo() {
    const info = JSON.parse(localStorage.getItem("accountInfo") || "{}");
    document.getElementById("accName").value = info.name || "";
    document.getElementById("accEmail").value = info.email || "";
}

// init
generateCalendar();
updateWeeklySummary();
updateTimers();
