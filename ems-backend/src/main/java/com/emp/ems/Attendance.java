package com.emp.ems;
import jakarta.persistence.*;import java.time.*;import java.util.UUID;
@Entity @Table(name="attendance",indexes={@Index(name="idx_attendance_employee_log_date",columnList="employee_id,log_date"),@Index(name="idx_attendance_log_date",columnList="log_date")})
public class Attendance {
 @Id UUID id=UUID.randomUUID();@ManyToOne(fetch=FetchType.LAZY,optional=false)@JoinColumn(name="employee_id",nullable=false)Employee employee;@Column(nullable=false)LocalDate logDate;@Column(nullable=false)Instant clockIn;Instant clockOut;
 protected Attendance(){}record View(UUID id,UUID employeeId,Instant clockIn,Instant clockOut){}
 View view(){return new View(id,employee.id,clockIn,clockOut);}
}
