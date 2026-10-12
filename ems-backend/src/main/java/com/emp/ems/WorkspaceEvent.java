package com.emp.ems;
import jakarta.persistence.*;import java.time.LocalDate;import java.util.UUID;
@Entity @Table(name="workspace_events",indexes=@Index(name="idx_event_date",columnList="event_date"))
public class WorkspaceEvent {
 @Id UUID id=UUID.randomUUID();@Column(nullable=false,length=150)String title;@Column(nullable=false,length=500)String description;@Column(name="event_date",nullable=false)LocalDate date;@Column(name="event_time",nullable=false,length=50)String time;@Column(nullable=false)int attendees;@Column(length=30)String tag;
 protected WorkspaceEvent(){}record View(UUID id,String title,String description,LocalDate date,String time,int attendees,String tag){}View view(){return new View(id,title,description,date,time,attendees,tag);}
}
