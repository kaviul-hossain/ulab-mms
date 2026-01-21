import csv
import re

# 1. PASTE THE RAW DATA HERE
# (I have included the data you provided in the variable below)
raw_data = """
Course Code: CSE1102
Course Title: Introduction to Programming
Credit Hour: 1.00
Prerequisite: N/A
Content: Fundamental concepts of procedural programming. Algorithms and problem solving, data types, control structures, functions, arrays, files, and the mechanics of running, testing, and debugging.
Textbook: 1. Let Us C by Yashavant Kanetkar, Latest Edition
2. Teach yourself C by Herbert Schildt, Latest Edition
 
Course Code: MAT1101
Course Title: Differential and Integral Calculus
Credit Hour: 3.00
Prerequisite: N/A
Content: Functional Analysis and Graphical Information: function, properties of functions, graphs of functions, new function from old, lines and family of functions, Limit: Limits (an informal view), one sided limits, the relation between one sided and two sided limits, computing limits, Continuity: continuity and discontinuity, some properties of continuity, the intermediated value theorem. Derivatives: slop and rate of change, tangent and normal, derivative of a function, physical meaning of derivative of a function, techniques of differentiation, chain rule, successive derivatives. Derivative in graphing and applications: analysis of functions, maximum and minimum, Expansion of functions: Taylor's series, Maclaurin's series, Leibniz; Rolle's and Mean Value theorems, Partials and total derivatives of a function of two or three variables. Different techniques of integration: integration, fundamental integrals, methods of substitutions, integration of rational functions, integration by parts, integrals of special trigonometric functions, reduction formulae for trigonometric functions. Definite integrals: general properties of definite integral, definite integral as the limit of sum and as an area, definition of Riemann integral, Fundamental theorem of integral calculus and its applications to definite integrals, determination of arc length, Improper integrals, Double integrals, Evaluation of Areas and Volumes. Introduction to MATLAB and LAB Sessions.
Textbook: 1. Calculus by Howard Anton, Irl C. Bivens, Stephen Davis, 11th Edition
2. Calculus: An Applied Approach by Ron Larson, 9th Edition
 
Course Code: MAT1201
Course Title: Co-Ordinate Geometry and Linear Algebra
Credit Hour: 3.00
Prerequisite: N/A
Content: Coordinate Geometry: Coordinates, polar coordinates, straight lines, Changes of axes, Pair of straight lines, Circle, Parabola, Ellipse, Hyperbola, rectangular coordinate, plane. Vector Analysis: Vector components, vector components in spherical and cylindrical system, vector operators, scalar and dot product, application of vector geometry, Derivative of vector, del, gradient, divergence and curl, physical significance, integration of vector. Line, surface and volume integration, Theorems (Green's, Gauss's, Liouville's, Stoke's) and their applications. Linear Algebra: Systems of Linear Equations (SLE): introduction to SLE, solution of a SLE, solution of a system of homogeneous LE, Gaussian and Gauss-Jordan elimination, Determinants: factorization, determinant, fundamental properties of determinants, minors and cofactors, Cramer's rules for solving a SLE, Algebra of Matrices: Matrix, some special types of matrices, transpose, adjoint and inverse of a matrix, algebraic operation on matrices, quadratic forms solution of a LE by applying matrices, Vector Space: space and subspace, Euclidean n-space, basis and dimension, rank and nullity, Linear Transformations (LT) and its Matrix Representations: LT from to , properties of LT, matrix representation of a LT, diagonalization of LT, Eigen Values and Eigen Vectors: polynomials of matrices and linear operators, eigen values and vectors, diagonalizability, Cayley-Hamilton theorem, characteristic and minimum polynomial Inner Product Spaces: inner product spaces, Cauchy-Schwarz inequality, orthogonality, Gram-Schmidt orthogonalization process, linear functional and adjoint operators, Some Applications of LA.
Textbook: 1. Co-ordinate Geometry with Vector Analysis by Rahman & Bhattacharjee
2. Introduction to Linear Algebra by Gilbert Strang, 5th Edition      
 
Course Code: MAT2101
Course Title: Differential Equation and Numerical Analysis
Credit Hour: 3.00
Prerequisite: N/A
Content: Basic Definitions and Terminology: differential equation (de), classifications of de, formation and solution of a de and further terminology, Ordinary de (ode), des of the first order and first degree: variable separable, homogeneous equations, exact equations, linear equations, Linear Equations with constant coefficients: linear and nonlinear de, solution of linear de, 2nd order des, 2nd and higher order homogeneous des, Method of Variation of Parameter; Method of undetermined coefficients; System of Linear de: operator method matrices and system of linear first order equations, homogeneous linear systems, undetermined coefficients, variation of parameters, Solution by Series. Errors in Numerical Calculations: numbers and their accuracy, errors and their computation, a general error formula, error in a series approximation, Solution of Algebraic and Transcendental Equations: bisection, iteration, false position, Newton-Raphson methods, Interpolation: finite difference, forward, backward and central differences, Newton's formula for interpolation, Stirlings formula, Lagrange's interpolation formula, divided differences and their properties, Numerical Differentiation and Integration, Matrices and Linear Systems of Equations, Numerical Solution of Ordinary Differential Equations.
Textbook: 1. Introduction to Ordinary Differential Equations by Shepley L. Ross, 4th Edition
2. Numerical Analysis by Richard L. Burden, J. Douglas Faires, Annette M. Burden, 10th Edition
 
Course Code: STA2101
Course Title:  Probability and Statistics 
Credit Hour: 3.00
Prerequisite: N/A
Content: Introduction to Statistics: what is statistics, statistical data, statistical methods, scope and limitation of statistics, Populations and Samples, collection and presentation of data, Grouped Data and Histograms, Some Graphical Methods: bar charts, time plots, Pie charts, scatter plots, box and Whisker plots, Measure of Central Tendency: mean, median and mode. Measure of Variations, Measure of Skewness, Moments and Kurtosis, difference between Variation and Skewness. Correlation and Regression Analysis: significance of the study of correlation, types of correlation, difference between correlation and regression Analysis, Sampling and Sampling Distributions, Survey Sampling Methods. Probability: Probability: meaning of probability, classical definition of probability, statistical probability, some theorems in probability, distribution function. Probability distributions: Binomial, normal and exponential distributions.
Textbook: 1. Theory and problems of Statistics by Murray R Spiegel (Schaum's outline series)
2. Probability & Statistics for Engineers & Scientists by Ronald E. Walpole, Raymond H. Myers, Sharon L. Myers, Keying E. Ye, 9th Edition

Course Code: PHY1101
Course Title: Physics I
Credit Hour: 3.00
Prerequisite: N/A
Content: Vectors and motions: The SI units, position, displacement, velocity, acceleration, vectors & scalars, adding vectors, components of vectors, unit vectors, projectile motion. Forces: Newton's laws of motion, friction, Newton's gravitation, concepts of work & energy, conservation laws, planets & satellites, concepts of equilibrium. Oscillations: Simple harmonic motion, pendulum, resonance, transverse & longitudinal waves, Lissajous' figures, musical sounds, beats, Doppler Effect. Thermodynamics: Temperature & heat, Laws of thermodynamics, engines, refrigerators. 
Textbook: 1. Fundamentals of Physics by David Halliday, Robert Resnick, Jearl Walker, 11th Edition
2. Concepts of Modern Physics by Arthur Besier, 7th Edition
 
Course Code: PHY1102
Course Title: Physics I Lab
Credit Hour: 1.00
Prerequisite: N/A
Content: Based on the contents of PHY1101

Course Code: PHY1301
Course Title: Physics II 
Credit Hour: 3.00
Prerequisite: N/A
Content: Electromagnetism: Coulomb's law, Gauss' Law, Ohm's Law, Ampere's Law, Maxwell's equations, magnetic materials, corpuscular & wave properties of light. Special Theory of Relativity, Length Contraction & Time Dilation, Mass-Energy Relation, Photo Electric Effect, Quantum Theory, X-rays and X-ray Diffraction, Compton Effect, Dual Nature of Matter & Radiation, Atomic Structure, Nuclear Dimensions, Electron Orbits, Atomic Spectra, Bohr Atom, Radioactive Decay, half-life, (and Rays, Isotopes, Nuclear Binding Energy), Fundamentals of Solid State Physics, Lasers, Holography.
Textbook: 1. Fundamentals of Physics by David Halliday, Robert Resnick, Jearl Walker, 11th Edition
2. Concepts of Modern Physics by Arthur Besier, 7th Edition
 
Course Code: EEE1101
Course Title: Electrical Circuit 1
Credit Hour: 3.00
Prerequisite: N/A
Content: Fundamental electrical concepts and measuring units, DC voltages, current, resistance and power, laws of electrical circuits and methods of network analysis, principles of DC measuring apparatus, laws of magnetic fields and methods of solving simple magnetic circuits; Alternating current: instantaneous and RMS current, voltage and power, average power combinations of R, L & C circuits, phasor, representation of sinusoidal quantities.
Textbook:  1. Fundamentals of Electric Circuits by Charles K. Alexander, Matthew N. O. Sadiku
2. Engineering Circuit Analysis by Steven M. Durbin, Jack E. Kemmerly, William H. Hayt, 9th Edition
 
Course Code: EEE1102
Course Title: Electrical Circuit 1 Lab
Credit Hour: 1.00
Prerequisite: N/A
Content: Based on the theory course.

Course Code: EEE1301
Course Title: Electronic Devices and Circuits I
Credit Hour: 3.00
Prerequisite: N/A
Content: Introduction to semiconductors: intrinsic, p-type and n-type. PN junction: formation, and operating principles. PN junction diode: current-voltage characteristics, simplified models, dynamic resistance and capacitance. Zener diode: current-voltage characteristics and its applications. Diode circuits: Half-wave and full wave rectifiers with filter capacitors, Clippers and clampers, Zener shunt regulator. Metal-Oxide-Semiconductor Field-Effect-Transistor (MOSFET): structure, physical operation, current- voltage characteristics and regions of operations, small signal equivalent circuit models; Secondary effects: body effect, channel length modulation, Early effect and short channel effects; MOS amplifiers- biasing discrete and integrated MOS amplifier circuits, Single stage amplifier circuits, their configurations and DC analysis; AC analysis of single stage MOS amplifiers- Voltage and current gain, input and output resistances. MOSFET as active loads, MOSFET as a switch. Bipolar junction transistor (BJT): Basic structure. physical operation, BJT characteristics and regions of operation, DC analysis, biasing the BJT for discrete circuits, small signal equivalent circuit models, AC analysis of Single stage BJT amplifier circuits and their configurations.
Textbook: 1. Electronic Devices and Circuit Theory by Robert. L. Boylestad and Louis Nashelsky, 11th Edition 
2. Introductory Circuit Analysis by Robert L Boylestad, 13th Edition

 
Course Code: EEE1302
Course Title: Electronic Devices and Circuits I Lab
Credit Hour: 1.00
Prerequisite: N/A
Content: Based on the theory course.
 
Course Code: CSE1201
Course Title: Structured Programming
Credit Hour: 3.00
Prerequisite: CSE1102 
Content: Introduction to Basics of Computer and Programming, C Fundamentals. Introduction to C Programming (input, output, variables, data type, operators, and expressions). Structured Program Development in C: Basic of Flow Chart, Control Statements 1(if, if...else, switch, top-down and stepwise refinement). Program Control: Control Statements 2 (for, do…while, switch, break and continue), Nested Loop, Loop Control Statement (break, continue, goto). Introduction to Functions (Math Library Functions, Function Definitions, Function Prototypes and Argument, Recursive functions, References and Reference Parameters, passing arguments to functions and passing arguments by reference. Introduction to Arrays (Arrays, Declaring Arrays, Examples Using Arrays, Passing Arrays to Functions, arrays of strings), Searching Arrays, Sorting Arrays, Multidimensional Arrays, passing multi-dimensional array directly to function. Pointers (Pointer Variable Declarations and Initialization, NULL Pointer, Passing Arguments to Functions by Reference with Pointers, Pointer Expressions and Pointer Arithmetic, Arrays of Pointers, Function Pointers). Characters and Strings (String Input, String Manipulation, Comparison Functions, Search Functions, and Memory Functions).
Textbook: 1. Teach yourself C by Herbert Schildt, Latest Edition  
2. Schaum's Outline of Programming with C by Byron S Gottfried, 2nd Edition
    
Course Code: CSE1202
Course Title: Structured Programming Lab
Credit Hour: 1.00
Prerequisite: CSE1201
Content: Based on theory course.

Course Code: CSE1203
Course Title: Discrete Mathematics
Credit Hour: 3.00
Prerequisite: N/A
Content: Mathematical logic: propositional logic, predicate logic, mathematical reasoning and proof techniques; set theory: sets, relations, partial ordered sets, functions; counting: permutations, combinations, principles of inclusion and exclusion; discrete probability; functions: recurrence relations and recursive algorithms; growth of functions; graph theory: graphs, paths, trees; algebraic structures: rings and groups
Textbook: 1. Discrete Mathematics and its Applications by Kenneth H. Rosen, 8th Edition
2. Elements of Discrete Mathematics: A Computer Oriented Approach by Liu & Mohapatra, 4th Edition
 
Course Code: CSE1301
Course Title: Data Structures
Credit Hour: 3.00
Prerequisite: CSE1201, CSE1202
Content: Internal data representation; Abstract data types; elementary data structures: arrays, linked lists, stacks, queues, trees and graphs; basic data structures operations: traversal, insertion, deletion, searching, merging, sorting, tree; tree traversal and graph traversal; recursion and recursive algorithm, pattern matching; advanced data structures: heaps, Fibonacci heaps; search trees: binary search trees, AVL trees, multi-way search trees, sorting, hashing.
Textbook: 1. Schaum's Outline Of Theory and Problems of Data Structures, Latest Edition, Seymour Lipchutz
2. Mark Allen Weiss, Data Structures and Algorithm Analysis in C++, Third Edition, Addison Wesley
 
Course Code: CSE1302
Course Title: Data Structures Lab
Credit Hour: 1.00
Prerequisite: CSE1201, CSE1202
Content: Based on Theory course.

Course Code: CSE2101
Course Title:  Digital Logic Design
Credit Hour: 3.00
Prerequisite: N/A
Content: Course conduction on Digital logic, Boolean algebra, De-Morgan's law, logic gates and their truth tables, canonical forms, Combinational logic circuits, minimization techniques, Arithmetic and data handling logic circuits, decoders and encoders, Multiplexers and demultiplexers, Combinational Circuit design, Flip-flops, race around problems, Counters and their applications, PLA design, Synchronous and asynchronous logic design: state diagram, Mealy and Moore machines, State minimizations and assignments, Pulse mode logic, Fundamental mode design.
Textbook: 1. Digital Logic and Computer Design by M. Morris Mano, Latest Edition
2. Digital Systems by Ronald Tocci, Neal Widmer, Greg Moss, 12th Edition
 
Course Code: CSE 2102
Course Title:  Digital Logic Design Lab
Credit Hour: 1.00
Prerequisite: N/A
Content: Based on Theory course.

Course Code: CSE2103
Course Title: Object Oriented Programming
Credit Hour: 3.00
Prerequisite: CSE1201, CSE1202
Content: Object-Oriented Fundamentals, Encapsulation, Polymorphism, Inheritance, Class, Object, Java Language Introduction, Variable Types and operators, Casting, Arrays, Introducing classes, Adding methods to class, constructor, String Handling, Garbage collection, Inheritance, Inner Class, Abstract Classes, Interfaces and Packages, Exception Handling, Java Input / Output, Multithreaded Programming and Synchronization, Applet, Event Handling, Networking with Java, Introducing the Swing, Utility Classes, Java Generics.
Textbook: 1. Java: The Complete Reference by Herbert Schildt, 11th Edition
2. Effective Java by Joshua Bloch, 3rd Edition

Course Code: CSE2104
Course Title: Object Oriented Programming Lab
Credit Hour: 1.00
Prerequisite: CSE1201, CSE1202
Content: Based on Theory course.

Course Code: CSE2200
Course Title:  Design Project-I
Credit Hour: 1.00
Prerequisite: CSE2103 & CSE2104
Content: Based on object oriented programming

Course Code: CSE2201
Course Title: Algorithms
Credit Hour: 3.00
Prerequisite: CSE1201, CSE1202, CSE1203
Content: Introduction, Growth of Functions, Techniques for analysis of algorithms; Methods for the design of efficient algorithms: divide and conquer, greedy method, dynamic programming, back tracking, branch and bound; basic search and traversal techniques; topological sorting; connected components, spanning trees, shortest paths; Flow algorithms; Approximation algorithms; Parallel algorithms, Lower bound theory; NP-completeness, NP-hard and NP-complete problems.
Textbook: 1. Introduction to Algorithms by Thomas H. Cormen , Charles E. Leiserson , Ronald L. Rivest and Clifford Stein, 3rd Edition 
2. Algorithm Design by Kleinberg Jon, 1st Edition

Course Code: CSE2202
Course Title: Algorithms Lab
Credit Hour: 1.00
Prerequisite: CSE1201, CSE1202, CSE1203
Content: Based on theory course.

Course Code: CSE2203
Course Title: Computer Organization and Architecture
Credit Hour: 3.00
Prerequisite: CSE2101
Content: Information representation; Measuring performance; Instructions and data access methods: operations and operands of computer hardware, representing instruction, addressing styles; Arithmetic Logic Unit (ALU) operations, floating point operations, designing ALU; Processor design: datapaths - single cycle and multicycle implementations; Control Unit design - hardwired and microprogrammed; Hazards; Exceptions; Pipeline: pipelined datapath and control, superscalar and dynamic pipelining; Memory organization: cache, virtual memory, channels; Concepts of DMA and Interrupts; Buses: overview of computer BUS standards; Multiprocessors: types of multiprocessors, performance, single bus multiprocessors, multiprocessors connected by network, clusters.
Textbook: 1. Computer System Architecture by M. Morris Mano.
2. Computer Architecture, Fifth Edition: A Quantitative Approach 
 
Course Code: CSE2301
Course Title: Database Management System
Credit Hour: 3.00
Prerequisite: N/A
Content: Concepts of database systems; Data Models: Entity-Relationship model, Relational model; Query Languages: Relational algebra, SQL; Constraints and triggers; Functional dependencies and normalization; File organization and data storage; Indexing: primary and secondary indexes, B+ trees, hash tables; Query optimization; Transaction management; Recovery; Concurrency control; Access control and security; Semi-structured database: XML, XPath, XQuery; Object oriented and object relational databases.
Textbook: 1. Database System Concepts Sixth Edition by Silberschatz, Korth and Sudarshan.
2. R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, Fifth Edition.

Course Code: CSE2302
Course Title: Database Management System Lab
Credit Hour: 1.00
Prerequisite: N/A
Content: Based on theory course.

Course Code: CSE2303
Course Title: Automata and Theory of Computation
Credit Hour: 3.00
Prerequisite: CSE2201
Content: Introduction to Automata and Theory of Computation. Finite State Machines. Regular Expressions. Context Free Grammar. Push Down Automata. Turing Machine. Decidable and Undecidable Language.
Textbook: As per instructor's guideline

Course Code: CSE2305
Course Title: Operating Systems
Credit Hour: 3.00
Prerequisite: CSE2203
Content: Introduction: What is an operating system? History of operating system, Operating system concepts, Operating system structure, Processes and Threads, Interprocess communication, Scheduling, Classical IPC problems, Memory Management, No memory abstraction, Virtual memory, Page replacement algorithms, Design issues for paging systems, Implementation issues, File Systems, Files, Directories, File system management, Input / Output, Principles of I/O hardware, Principles of I/O software, I/O software layers, Disks, Clocks, Thin clients, Deadlocks, Resources Detection, Recovery, Avoidance, Prevention, Virtualization and Cloud.
Textbook: 1. Operating System Concepts, 7th / 8th Edition, by Abraham Silberschatz
2. Modern Operating Systems 4th Edition, by Andrew S. Tanenbaum

Course Code: CSE2306
Course Title: Operating Systems Lab
Credit Hour: 1.00
Prerequisite: CSE2203
Content: Based on Theory course.
 
Course Code: CSE3101
Course Title: Microprocessor and Microcontroller 
Credit Hour: 3.00
Prerequisite: CSE2203
Contents: Introduction of Microprocessor and its use, Microprocessor and Memory Basics, Microprocessor: microcontroller & microcomputer, evaluation of microprocessor & application, introduction to 8-bit, 16-bit, and 32-bit microprocessors; addressing modes: absolute addressing, 8086 internal architecture, PIN diagram of 8086, Max-Min mode, register structure; memory read write cycle; Instruction set; pipeline concept: interrupts, programmed I/O, memory mapped I/O, interrupt driven I/O, direct memory access; block transfer; cycle stealing; interleaved; multi-tasking and virtual memory; memory interface; bus interface; arithmetic co-processor; assembly language programming of 8086 microprocessors., serial data transmission, serial communication standards, serial interface implementation. Arduino: Buttons, PWM, and Functions, Arduino: Serial Communication and Processing, I2C, Modbus RTU, TCP/TP Communication and SPI Interfaces, Wireless Communication, Arduino: Interrupts and Hardware Handling, collecting data from external environment via sensors and send/receive data to cloud, learning about python interfacing Program to collect real time, data plotting simultaneously. 
Textbook: 1. Microprocessor and Interfacing by DOUGLAS V Hall
2. IBM PC Assembly Language and Programming by Peter Abel, 5th Edition

 
Course Code: CSE3102
Course Title: Microprocessor and Microcontroller Lab
Credit Hour: 1.00
Prerequisite: CSE2203
Contents: Based on theory course.

 
Course Code: CSE3103
Course Title: System Analysis and Design
Credit Hour: 3.00
Prerequisite: CSE2103 
Content: System Analysis Fundamentals, tools of information system development, information systems development life cycle, tools for analysis; planning phase: systems planning, preliminary planning and investigation, determining IS development requirements, project management, Object Oriented Systems Analysis and Design and Unified Modeling Language.; analysis phase: analysing requirements, evaluating alternatives, information systems analysis principles; design phase: structured information systems design, input design and control, output system design; development phase: information systems development, computer-aided software engineering; implementation phase: systems implementation, systems evaluation and optimization, information systems documentation, Costs and benefits of different approaches to implementing new systems.
Textbook: 1. Systems Analysis and Design, 9th edition by Kendall and Kendall
2. System Analysis and Design, 5th edition by Dennis, Wixom and Roth

Course Code: CSE3201
Course Title: Artificial Intelligence & Machine Learning
Credit Hour: 3.00
Prerequisite: CSE2201, CSE2202, STA2101, MAT1201
Content: Artificial Intelligence and Intelligent Agents, Problem Solving (Solving Problems by Searching, Adversarial Search, Constraint Satisfaction Problems), Knowledge and Reasoning (Logical Agents, First-Order Logic, Inference in First-Order Logic, Classical Planning, Planning and Acting in the Real World, Knowledge Representation), Uncertain Knowledge and Reasoning (Quantifying Uncertainty, Probabilistic Reasoning, Probabilistic Reasoning over Time, Making Simple Decisions, Making Complex Decisions), Learning (Learning from Examples, Knowledge in Learning, Learning, Probabilistic Models, Reinforcement Learning).
Introduction to machine learning; Regression analysis: Logistic regression, linear regression; Classification techniques: Supervised and unsupervised classification; Neural networks; Support vector machines; Classification trees; Rule based learning; Instance based learning; Reinforcement learning; Ensemble learning; Negative correlation learning; Evolutionary algorithms; Genetic algorithm, Statistical performance evaluation techniques of learning algorithms: bias-variance tradeoff; Practical applications of machine learning recent applications of machine learning, such as to robotic control, data mining, autonomous navigation, bioinformatics, speech recognition, and text and web data processing
Textbook: 1. Artificial Intelligence – A Modern Approach, Prentice-Hall, 2003 by Stuart J. Russel and Peter Norvig.
2. Introduction to Artificial Intelligence and Expert Systems, Prentice-Hall, 2003 by Dan W. Patterson.
3. Pattern Recognition and Machine Learning by Christopher Bishop
 
Course Code: CSE3202
Course Title: Artificial Intelligence & Machine Learning Lab
Credit Hour: 1.00
Prerequisite: CSE2201, CSE2202, STA2101, MAT1201
Content: Based on theory course.
 
Course Code: CSE3203
Course Title: Software Engineering
Credit Hour: 3.00
Prerequisite: CSE3103
Content: Introduction to Software Engineering as a Discipline. Software Life Cycles. Software Requirement Specification and Analysis, Object Oriented Analysis and Design, Design patterns, Architectural patterns and scaling concern, Software Quality Assurance, Project management, Testing.
Textbook: 1. Software Engineering, 9th Edition by Ian Sommerville.
2. Object-oriented and classical software engineering 8th edition by Schach.
 
Course Code: CSE3205
Course Title: Computer Networks
Credit Hour: 3.00
Prerequisite: N/A
Content: Introduction to computer networks: protocol layers, network performance Metrics-Delay, loss, throughput, jitter; circuit and packet switching; application layer: protocol overview of HTTP, FTP, SMTP, DNS, SNMP, P2P, client server and hybrid applications of the Internet; transport layer: protocol overview of TCP and UDP, principles of reliable data transfer, flow control, congestion control, TCP Reno, TCP Tahoe, socket programming; network layer: overview of IPv4 and IPv6, IP addressing, components of a router, routing and forwarding functions of a router, routing algorithms: link state and distance vector, OSPF and BGP; wireless networks: definition and types of wireless networks, MAC and routing in wireless networks, mobility and mobile IPv6.
Textbook: 1. Data Communications and Networking by Behrouz Forouzan.
2. Computer Networks- A. Tanenbum.
 
Course Code: CSE3206
Course Title: Computer Networks Lab
Credit Hour: 1.00
Prerequisite: N/A
Content: Based on theory course.

Course Code: CSE3301
Course Title: Cyber Security
Credit Hour: 3.00
Prerequisite: CSE2305, CSE2306, CSE3205, CSE3206
Contents: Introduction to cyber security. Basic concepts: confidentiality, integrity, availability, security policies, security mechanisms, assurance. Basic Cryptography; Secret Key Cryptography, Message Digests, Public Key Cryptography; Authentication; Trusted Intermediaries; Real-time Communication Security; Electronic Mail Security; Firewalls and Web Security. Computer Security Management, Establishing and Managing Information Assurance, Forensics of Cyber Security, Hacking Techniques, Investigation and Response: Systems Forensics.
Textbook: 1. Cryptography and Network Security by W. Stallings, 7th Edition
2. Introduction to Network Security: Theory and Practice by J. Wang and Z. A. Kissel
3. Cybersecurity Essentials by Charles J. Brooks, Christopher Grow, Philip Craig, Donald Short, 1st Edition

Course Code: CSE3120
Course Title: Web Programming Lab
Credit Hour: 1.00
Prerequisite: CSE2103 & CSE2104
Contents: Introduction to Web Technologies. HTML5, CSS3 with it's new components. JavaScript, jQuery, AJAX. Data transmission, formats and processes. XML and JSON. 

 
Course Code: CSE3200
Course Title: Design Project-II
Credit Hour: 1.00
Prerequisite: CSE2301, CSE2302, CSE3103, CSE2200
Content: Software Design.

 
Course Code: CSE4098 A, B, C
Course Title: Capstone Project 
Credit Hour: 4.00
Prerequisite: All Major Core Courses, GED 2248, 2243, 2159
Content: Capstone Project Design and Implementation.
 
Major Elective Courses
Course Code: CSE4401
Course Title: Computer Graphics
Credit Hour: 3.00
Prerequisite: MAT1201
Content: Introduction to Graphical data processing, Fundamentals of interactive graphics programming, Architecture of display devices and connectivity to a computer, Implementation of graphics concepts of two-dimensional and three-dimensional viewing, clipping and transformations, Hidden line algorithms, Raster graphics concepts: Architecture, algorithms and other image synthesis methods, Design of interactive graphic conversations.
Textbook: 1. Computer Graphics: Principles and Practice in C (2nd Edition) by James D. Foley, Andries van Dam, Steven K. Feiner and John F.
2. OpenGL Programming Guide: The Official Guide to Learning OpenGL by Dave Shreiner, Mason Woo, Jackie Neider, Tom Davis, Version 4.5, 9th Edition

Course Code: CSE4402
Course Title: Computer Graphics Lab
Credit Hour: 1.00
Prerequisite: MAT1201 
Content: Lab works based on CSE 401.

 
Course Code: CSE4403
Course Title: Advanced Algorithm 
Credit Hour: 3.00
Prerequisite: CSE22012, CSE2202
Content: Computational complexity, Parameterized complexity, Algorithms for combinatorial optimization, practical computing and heuristics, Approximation algorithms, LP based approximation algorithms, randomized algorithms, Experimental algorithmic, Algorithms in state-of-the-art fields like Bioinformatics, Grid Computing, VLSI design etc.
Textbook: 1. Introduction to Algorithms by Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein, 3rd Edition
2. Algorithms by Robert Sedgewick, Kevin Wayne, 4th Edition

 
Course Code: CSE4405
Course Title: Compiler Design
Credit Hour: 3.00
Prerequisite: CSE2303
Content: Theory and Practice; An introduction to compiler and interpreter design, with emphasis on practical solutions using compiler writing tools such as Yacc in UNIX, and the C programming language, Topics covered include: lexical scanners, context free languages and pushdown automata, recursive descent parsing, bottom up parsing, attributed grammars, symbol table design, run time memory allocation, machine language, code generation and optimisation.
Textbook: 1. Compilers: Principles, Techniques, and Tools – Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman. Second Edition
2. Modern Compiler Design by D. Grune, K. Reeuwijk H. Bal, C. Jacobs and K. Langendoen. Second Edition.

 
Course Code: CSE4405
Course Title: Compiler Design
Credit Hour: 3.00
Prerequisite: CSE2303

Content: Theory and Practice; An introduction to compiler and interpreter design, with emphasis on practical solutions using compiler writing tools such as Yacc in UNIX, and the C programming language, Topics covered include: lexical scanners, context free languages and pushdown automata, recursive descent parsing, bottom up parsing, attributed grammars, symbol table design, run time memory allocation, machine language, code generation and optimisation.

Textbook: 1. Compilers: Principles, Techniques, and Tools – Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman. Second Edition
2. Modern Compiler Design by D. Grune, K. Reeuwijk H. Bal, C. Jacobs and K. Langendoen. Second Edition.


 

Course Code: CSE4406
Course Title: Compiler Design Lab
Credit Hour: 1.00
Prerequisite: CSE2303

Content: Lab works based CSE4405

 

Course Code: CSE4407
Course Title: Basic Graph Theory
Credit Hour: 3.00
Prerequisite: CSE2303

Content: simple graphs, digraphs, subgraphs, vertex-degrees, walks, paths and cycles; Trees, spanning trees in graphs, distance in graphs; Complementary graphs, cut-vertices, bridges and blocks, k-connected graphs; Euler tours, Hamiltonian cycles, Chinese Postman Problem, Traveling Salesman Problem; Chromatic number, chromatic polynomials, chromatic index, Vizingâ€™s theorem, planar graphs, perfect graphs.

Textbook: 1. Introduction to graph theory by Robin J.Wilson (5th edition)
2. Introduction to graph theory by Douglas N.West (2nd edition)
3. Graph Theory and applications to engineering and computer science by Narshingh Deo

 

Course Code: CSE4409 
Course Title: Mathematical Analysis for Computer Science
Credit Hour: 3.00
Prerequisite: STA2101, CSE2303

Content: Recurrent problems; Manipulation of sums; Number theory; Special numbers; Generating functions. Random variables; Stochastic process; Markov chains: discrete parameter, continuous parameter, birth-death process; Queuing models: birth-death model, Markovian model, open and closed queuing network; Application of queuing models.

Textbook: 1. Concrete Mathematics: A Foundation for Computer Science, by Ronald Graham, Donald Knuth, and Oren Patashnik. 2nd Edition
2. The Art of Computer Programming, Volume 1 and 2, by Donald E. Knuth. 3rd Edition
3. Introduction to Probability Models, by Seldon M. Ross, 10th Edition
4. Probability and Statistics with Reliability, Queing, and Computer Science Applications, by Kishor S. Trivedi, 2nd Edition

 

Course Code: CSE4411 
Course Title: Computational Geometry
Credit Hour: 3.00
Prerequisite: CSE2303, MAT1101, MAT1201, MAT2101

Content: Topics in surface modeling: b-splines, non-uniform rational b-splines, physically based deformable surfaces, sweeps and generalized cylinders, offsets, blending and filleting surfaces. Non-linear solvers and intersection problems. Solid modeling: constructive solid geometry, boundary representation, non-manifold and mixed-dimension boundary representation models, octrees. Robustness of geometric computations. Interval methods. Finite and boundary element discretization methods for continuum mechanics problems. Scientific visualization. Variational geometry. Tolerances. Inspection methods. Feature representation and recognition. Shape interrogation for design, analysis, and manufacturing. Involves analytical and programming assignments.

Textbook: 1. Computational Geometry: Algorithms and Applications by M. Berg and O. Cheong, 3rd Edition
2. Computational Geometry in C by J O'Rourke, 2nd Edition
3. Discrete and Computational Geometry by S. L. Devadoss and J. O'Rourke

 

Course Code: CSE4413
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: 

Content: As necessary.

 

Course Code: CSE4415
Course Title: Data Communication
Credit Hour: 3.00
Prerequisite: N/A

Content: Signal and random processes; Review of Fourier Transform; Hilbert Transform, continuous wave modulation: AM, PM, FM; Sampling theorem; Pulse modulation: PAM, PDM, PPM, PCM, companding, delta modulation, differential PCM; Multiple access techniques: TDM, FDM; Digital modulation: ASK, PSK, BPSK, QPSK, FSK, MSK, constellation, bit error rate (BER); Noise; Echo cancellation; Intersymbol Interference; Concept of channel coding and capacity. Synchronous and asynchronous communications; Hardware interfaces, multiplexers, concentrators and buffers; Communication mediums and their characteristics; Data communication services: SMDS and ATM; Error control codes: linear block codes, cyclic codes, MLDC codes, convolution codes, Trellis code modulation; Digital switching: space and time division switching; Radio system design; Fiber optics communication: transmitter, receivers, network components, WDM; Line coding, trunks, multiplexing, switching, ATM switches; Satellite communications: frequency bands and characteristics, types of satellites, transmission impairments, capacity allocation; Multiple access techniques.

Textbook: 1. Data Communications and Networking by B. Forouzan, 4th Edition
2. Data and Computer Communications by W. Stallings, 10th Edition

 

Course Code: CSE4416
Course Title: Data Communication Lab
Credit Hour: 1.00
Prerequisite: N/A

Content: Lab works based CSE4415

 

Course Code: CSE4417
Course Title: Internet of Things 
Credit Hour: 3.00
Prerequisite: CSE3205, CSE3206

Content: Introduction to Internet in general and Internet of Things: layers, protocols, packets, services, performance parameters of a packet network as well as applications such as web, Peer-to-peer, sensor networks, and multimedia. Transport services: TCP, UDP, socket programming; Network layer: forwarding & routing algorithms (Link, DV), IP-addresses, DNS, NAT, and routers; Local Area Networks, MAC level, link protocols such as: point-to-point protocols, Ethernet, WiFi 802.11, cellular Internet access, and Machine-to-machine; Mobile Networking: roaming and handoffs, mobile IP, and ad hoc and infrastructure less networks; Real-time networking: soft and real time, quality of service/information, resource reservation and scheduling, and performance measurements; IoT definitions: overview, applications, potential & challenges, and architecture; IoT examples: Case studies, e.g. sensor body-area-network and control of a smart home.

Textbook: 1. IoT Fundamentals: Networking Technologies, Protocols, and Use Cases for the Internet of Things by D. Hanes, 1st Edition
2. Internet of Things for Architects: Architecting IoT solutions by implementing sensors, communication infrastructure, edge computing, analytics, and security by P. Lea

 

Course Code: CSE4418
Course Title: Internet of Things Lab
Credit Hour: 1.00
Prerequisite: CSE3205, CSE3206

Content: Lab works based CSE4417

 

Course Code: CSE4419
Course Title: Network Security
Credit Hour: 3.00
Prerequisite: CSE3301

Content: Introduction to network security. Basic concepts: confidentiality, integrity, availability, security policies, security mechanisms, assurance.Basic Cryptography; Secret Key Cryptography, Message Digests, Public Key Cryptography; Authentication; Trusted Intermediaries; Real-time Communication Security; Electronic Mail Security; Firewalls and Web Security.

Textbook: 1. Cryptography And Network Security by W. Stallings, 7th Edition
2. Introduction to Network Security: Theory and Practice by J. Wang and Z. A. Kissel

 

 

Course Code: CSE4420
Course Title: Network Security Lab 
Credit Hour: 1.00
Prerequisite: CSE3301

Content: Lab works based CSE4419

 

 

Course Code: CSE4421
Course Title: Wireless and Cellular Communication
Credit Hour: 3.00
Prerequisite: N/A

Content: Introduction to wireless communications: history and evolution, current wireless communication system    s, requirements of wireless services, and technical challenges of wireless communications. Radio wave propagation in the mobile environment: Free-space propagation, propagation mechanisms, large scale and small scale fading, path loss models, statistical channel models: narrowband and wideband models, System Planning: mobile radio link design, and introduction to radio network planning. Overview of wireless access networks: base and subscriber stations, multiple access technologies, noise and interference in wireless communication systems, diversity reception, MIMO communication: MIMO narrowband channel model, transmit diversity and spatial multiplexing Evolution of cellular systems, principles and operation of cellular systems, narrowband systems: FDMA and TDMA systems, frequency planing, and capacity considerations, CDMA wideband systems: resource allocation, soft handover, power control, interference and capacity, OFDMA wideband systems, and Standardized cellular communications systems. Wireless Network Standards: Wireless LANs, wireless MANs, short range wireless networks, standards, capabilities and applications, broadband wireless networks, and integration of different types of wireless networks Wireless Sensor Networks: Introduction to sensor networks and applications, issues in sensor networks in comparison to conventional wireless networks, special design considerations in energy conservation, routing etc.

Textbook:  As per instructor 's guideline


 

Course Code: CSE4423 
Course Title: Digital Signal Processing
Credit Hour: 3.00
Prerequisite: N/A

Content: Discrete time signals and systems: Fourier and Z transforms, DFT, 2-dimensional versions; Linear time invariant discrete time systems; Digital signal processing topics: flow graphs, realizations, FFT, quantization effects, linear prediction; Digital filter design methods: windowing, frequency sampling, S-to-Z methods, frequency-transformation methods, optimization methods, 2-dimensional filter design; Quantization of signals and filter coefficients; Oversampling techniques for ADC and DAC.

Textbook: 1. Digital Signal Processing by J. G. Proakis and D. K Manolakis, 4th Edition
2. Understanding Digital Signal Processing by Richard G. Lyons, 3rd Edition

 

 

Course Code: CSE4425  
Course Title: Advanced Network Services and Management
Credit Hour: 3.00
Prerequisite: CSE3205, CSE3206

Content: Network management: Layers of network management; infrastructure for network management; the key areas of network management (accounting, security, configuration, performance, and fault tolerance); the Internet management framework and protocols (SNMP, MlBs, and so on); practical limitations and case studies; and so on. Network security: Principles of cryptography; principles of information security; authentication; access control; integrity; attacks and countermeasures; secure network protocols (551., IPscc, and so on); practical limitations and case studies; and so on. Mobile and wireless data communications: Satellite communications; cellular wireless networks; mobile IP; wireless LAN technologies (802.11, Bluetooth, and so on); the Wireless Application Protocol (WAP); the Wireless Markup Language; and so on. Multimedia networking: Multimedia networking applications; multimedia information representation; streaming stored audio and video; video and audio conferencing; voice over IP; real-time communication protocols; RSVP; differentiated services; and so on.

Textbook: 1. Cloud Services, Networking, and Management by Nelson L. S. da Fonseca and Raouf Boutaba, 1st Edition
2. Next Generation Telecommunications Networks, Services, and Management by Thomas Plevyak and Veli Sahin, 1st Edition

 

Course Code: CSE4427
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: N/A

Content: As necessary.

 

Course Code: CSE4429
Course Title: Software Security 
Credit Hour: 3.00
Prerequisite: CSE3301

Content: Introduction to software security, Software vulnerabilities: memory (un-)safety, Introduction to reverse engineering, Dynamic defense mechanisms, Static protection through bug finding, Finding and exploiting vulnerabilities, Operating system security and forensics, Protecting data, Defense in practice, Web security, Browser security, Android/mobile security, Malware analysis.

Textbook: 1. Software Security: Principles, Policies, and Protection (SS3P, by Mathias Payer)
2. Software Security: Building Security In by G. McGraw, 1st Edition

 

Course Code: CSE4430
Course Title: Software Security Lab
Credit Hour: 1.00
Prerequisite: CSE3301

Content: Lab works based CSE4429

 

 

Course Code: CSE4431
Course Title: Blockchain
Credit Hour: 3.00
Prerequisite: N/A

Content: This course of the Blockchain specialization provides a broad overview of the essential concepts of blockchain technology – by initially exploring the Bitcoin protocol followed by the Ethereum protocol – to lay the foundation necessary for developing applications and programming. You will be equipped with the knowledge needed to create nodes on your personal Ethereum blockchain, create accounts, unlock accounts, mine, transact, transfer Ethers, and check balances.     

Textbook: 1. The Basics of Bitcoins and Blockchains: An Introduction to Cryptocurrencies and the Technology that Powers Them by Antony Lewis 
2. Hands-On Blockchain with Hyperledger: Building decentralized applications with Hyperledger Fabric and Composer by Nitin Gaur, Luc Desrosiers, Petr Novotny, Venkatraman Ramakrishna, Anthony O'Dowd, Salman A. Baset
3. Mastering Ethereum: Building Smart Contracts and DApps by Andreas M. Antonopoulos and Gavin Wood Ph.D., 1st Edition

 

Course Code: CSE4433
Course Title: Cryptography
Credit Hour: 3.00
Prerequisite: CSE3301

Content: Cryptography is an indispensable tool for protecting information in computer systems. This course contains the inner workings of cryptographic systems and how to correctly use them in real-world applications. The course begins with a detailed discussion of how two parties who have a shared secret key can communicate securely when a powerful adversary eavesdrops and tampers with traffic. Examine many deployed protocols and analyze mistakes in existing systems. Discussion on public-key techniques that let two parties generate a shared secret key. 

Textbook: 1. Introduction to Modern Cryptography by Jonathan Katz and Yehuda Lindell, 2nd Edition
2. Cryptography And Network Security by W. Stallings, 7th Edition 

 

Course Code: CSE4435
Course Title: ICT Law, Policy and Ethics
Credit Hour: 3.00
Prerequisite: GED 2159, GED 2248

Content: This course consists of a sustained study of ethical and legal issues that arise in relation to employment in the public and private sectors, including allocation of resources, corporate and social responsibility, relationships, and discrimination. A main focus of this course will be on the ethical and legal standards governing information technology. New technology creates ethical challenges for individuals around the globe and applies to most persons regardless of whether they are employed in the information technology field or a more traditional occupation. The study of Cyber Ethics provides a framework for making ethical decisions that professionals are likely to encounter in the workplace. This course will not only focus on ethics but on the legal, economic, social, cultural and global impacts of decisions that are made in the context of professional occupations.

Textbook: 1. Computer Ethics by Deborah G. Johnson, 4th Edition
2. A Gift of Fire: Social, Legal, and Ethical Issues for Computing and the Internet by Sara Baase, 5th Edition
3. Ethics for the Information Age by M. J. Quinn, 7th Edition

 

Course Code: CSE4437
Course Title: Digital Forensics and Incident Response
Credit Hour: 3.00
Prerequisite: CSE3301

Content: The overview of Principles of Forensics and IR, Data Collection Techniques, Forensic Hardware, Chain of Custody, Basic Incident Response Process, Pre-Incident Preparation, Documentation Requirements, Common Approaches, Containment and Remediation Strategies, Malware Footprints, Data Volatility, Installed Software and Hotfixes, Persistence Mechanisms, Windows Audit Policies, Malware Analysis, Prefetch Analysis, The Windows Registry, Windows Event Log Analysis, File Carving, Email Header Analysis, Determining File Headers, Extraction of Attachments, Extracting Specific File Types, Deleted Files and Recovery, Use of Hash Sets, Adding Hash Sets, Advantages of Timeline, Timeline Creation, Sources of Network Data, PCAP Analysis with Wireshark, Network Footprint Basics of Memory Acquisition and Analysis, Highlight Power of Memory, Live Response Best Practices and Order of Volatility, Following the Process Tree and Unix/Linux File Permissions.

Textbook: 1. Incident Response & Computer Forensics by Jason T. Luttgens, Matthew Pepe, Kevin Mandia, 3rd Edition
2. Digital Forensics and Incident Response: A practical guide to deploying digital forensic techniques in response to cyber security incidents by Gerard Johansen, 1st Edition  

 

Course Code: CSE 4439
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: N/A

Content: As necessary

 

Course Code: CSE4441
Course Title: Real-time Embedded Systems
Credit Hour: 3.00
Prerequisite: CSE3101

Content: Background, history, classifications, programming languages for embedded systems. Combinational logic and transistors, RT-level combinational and sequential components, customized single purpose processor design. Structure of microcontrollers, CPU, memory and I/O structure, various microcontrollers, ARM. I/O and memory mapping, addressing modes, interrupts and traps, bus protocols, DMA, system bus configurations, RAM, ROM, SDRAM, flash, basic I/O interfaces. Parallel ports, LEDs, pushbutton, keypad, 7-segment display, LCD display, touchscreen, timers and counters, serial Interface, networked embedded systems. C-language primer, state machines, streams, circular buffers. Development environment, hardware/software debugging techniques, performance analysis, use of hardware debugging modules. CPU and hardware acceleration, multiprocessor performance analysis. Design methodologies and flows, requirement analysis, specifications description, system analysis and architecture design, quality assurance.

Textbook: 1. Embedded Systems Architecture: A Comprehensive Guide for Engineers and Programmers by Tammy Noergaard 2nd Edition
2. Real-Time Embedded Systems: Design Principles and Engineering Practices by Xiaocong Fan, 1st Edition

 

Course Code: CSE4442
Course Title: Real-time Embedded Systems Lab
Credit Hour: 1.00
Prerequisite: CSE3102

Content: Lab works based CSE 4441


 

Course Code: CSE4443
Course Title: Distributed Systems
Credit Hour: 3.00
Prerequisite: CSE2305, CSE3101

Content: This course covers general introductory concepts in the design and implementation of distributed systems, covering all the major branches such as Cloud Computing, Grid Computing, Cluster Computing, Supercomputing, and Many-core Computing. The specific topics that this course will cover are: scheduling in multiprocessors, memory hierarchies, synchronization, concurrency control, fault tolerance, data parallel programming models, scalability studies, distributed memory message passing systems, shared memory programming models, tasks, dependence graphs and program transformations, parallel I/O, applications, tools (Cuda, Swift, Globus, Condor, Amazon AWS, OpenStack, Cilk, gdb, threads, MPICH, OpenMP, Hadoop, FUSE), SIMD, MIMD, fundamental parallel algorithms, parallel programming exercises, parallel algorithm design techniques, interconnection topologies, heterogeneity, load balancing, memory consistency model, asynchronous computation, partitioning, determinacy, Amdahl's Law, scalability and performance studies, vectorization and parallelization, parallel programming languages, and power. 

Textbook: 1. Distributed Systems: Principles and Paradigms by Andrew S. Tanenbaum and Maarten van Steen, 2nd Edition
2. Distributed Systems:  Maarten van Steen and Andrew S. Tanenbaum, 3.01 Edition

 

 

Course Code: CSE4445
Course Title: Simulation and Modeling
Credit Hour: 3.00
Prerequisite: STA2101, CSE2201 

Content: System Models- Entities, Attributes, States, Activities, Types of Models, Static & Dynamic Models, Deterministic & Stochastic Activities. Principles used in Modeling. System Simulation Continuous & Discrete event simulation Languages- GPSS, SIMULA, CSMP, DYNAMO. Probability concepts in Simulation- Random number, stochastic processes, Birth-Death process. Parameter estimation & input/output validation. Statistical Hypothesis Testing. Queuing Systems, M/M/I & M/M./m queues, Bulk arrival & Bulk service systems. Queuing networks. Computational algorithms & approximation techniques. Workload characterization & performance evaluation of computer systems. Evaluation of program performance. Case studies.

Textbook: 1. Handbook Of Simulation: Principles Methodology, Advances, Applications And Practice by Jerry Banks, 1st Edition
2. Discrete-Event System Simulation by Jerry Banks, John S. Carson II, Barry L. Nelson, David M. Nicol, 5th Edition

 

 

Course Code: CSE4446
Course Title: Simulation and Modeling Lab
Credit Hour: 1.00
Prerequisite: CSE2201

Content: Lab works based CSE4445

 

 

Course Code: CSE4447
Course Title: Introduction to Robotics
Credit Hour: 3.00
Prerequisite: MAT1201, CSE3201

Contents: Basics of Robotics and Linear Algebra, Representing positions and rotations, Rotational transformations and parameterizations of rotations, Homogeneous transformations, kinematic chains and Denavit–Hartenberg (DH) convention, DH convention and forward kinematics, Inverse kinematics and angular velocity, Jacobian, Trajectory design and configuration space, Configuration space with examples and motion planning introduction, Motion planning: potential field and Probabilistic Roadmaps (PRM). 

Textbook: Introduction to Robotics: Analysis, Control, Applications by Saeed B.Niku, 2nd Edition
Robot Modelling and Control by M. W. Spong, 1st Edition

 

Course Code: CSE4449
Course Title: Cloud Computing
Credit Hour: 3.00
Prerequisite: N/A

Contents: Cloud Computing has transformed the IT industry by opening the possibility for infinite or at least highly elastic scalability in the delivery of enterprise applications and software as a service (SaaS). Amazon Elastic Cloud, Microsoft 's Azure, Google App Engine, and many other Cloud offerings give mature software vendors and new start-ups the option to deploy their applications to systems of infinite computational power with practically no initial capital investment and with modest operating costs proportional to the actual use. The course examines the most important APIs used in the Amazon and Microsoft Cloud, including the techniques for building, deploying, and maintaining machine images and applications. We will learn how to use Cloud as the infrastructure for existing and new services. We will use open source implementations of highly available clustering computational environments, as well as RESTful Web services, to build very powerful and efficient applications. We also learn how to deal with not trivial issues in the Cloud, such as load balancing, caching, distributed transactions, and identity and authorization management

Textbook: 1. Cloud Computing: Methodology, Systems, and Applications by Lizhe Wang, Rajiv Ranjan, Jinjun Chen, Boualem Benatallah, 1st Edition
2. Cloud Computing: A Practical Approach by Robert C. Elsenpeter, Toby Velte, Anthony Velte, 1st Edition

 

 

Course Code: CSE4451
Course Title: Advanced Database Management Systems
Credit Hour: 3.00
Prerequisite: CSE2301, CSE2302, STA2101

Content: Basic Concepts, Ordered Indices, Tree Index Files, Static Hashing, Dynamic Hashing, Comparison of Ordered Indexing and Hashing; Measures of Query Cost, Selection Operation, Sorting, Join Operation, Evaluation of Expressions; Transformation of Relational Expressions, Catalog Information for Cost Estimation, Statistical Information for Cost Estimation, Cost-based optimization; Transaction Concept, Transaction State, Concurrent Executions, Serializability; Lock-Based Protocols, Timestamp Based Protocols; Failure Classification, Storage Structure, Recovery and Atomicity, Log-Based Recovery, Recovery With Concurrent Transactions; Data Mining, Decision tree, Bayes theory, Randomize tree; Database System Architectures: Centralized and Client-Server Systems, Server System Architectures, Parallel Systems, Distributed Systems, Network Types; I/O Parallelism, Interquery Parallelism, Intraquery Parallelism, Intraoperation Parallelism, Interoperation Parallelism; Distributed Data Storage, Distributed Transactions, Commit Protocols; Database Design, Database Tuning Security and Authorization, Multidimensional query.

Textbook: 1. Database Systems: Design, Implementation, & Management by Carlos Coronel and Steven Morris, 13th Edition
2. Database Systems The Complete Book by Garcia-Molina, 2nd Edition

 

 

Course Code: CSE4453
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: N/A
Content: As necessary

 

 

Course Code: CSE4455
Course Title: Data Mining 
Credit Hour: 3.00
Prerequisite: CSE2201, CSE2301

Content: In this course we explore how this interdisciplinary field brings together techniques from databases, statistics, machine learning, and information retrieval. We will discuss the main data mining methods currently used, including data warehousing and data cleaning, clustering, classification, association rules mining, query flocks, text indexing and searching algorithms, how search engines rank pages, and recent techniques for web mining. Designing algorithms for these tasks is difficult because the input data sets are very large, and the tasks may be very complex. One of the main focuses in the field is the integration of these algorithms with relational databases and the mining of information from semi-structured data, and we will examine the additional complications that come up in this case.

Textbook: 1. Data Mining: Concepts and Techniques by Jiawei Han, Micheline Kamber, and Jian Pei, 3rd Edition
2. Mining of Massive Datasets by Jure Leskovec, Anand Rajaraman, Jeff Ullman, 2nd Edition


 

Course Code: CSE4457
Course Title: Data Science 
Credit Hour: 3.00
Prerequisite: CSE3201

Content: Data Science is the study of the generalizable extraction of knowledge from data. Being a data scientist requires an integrated skill set spanning mathematics, statistics, machine learning, databases and other branches of computer science along with a good understanding of the craft of problem formulation to engineer effective solutions. This course will introduce students to this rapidly growing field and equip them with some of its basic principles and tools as well as its general mindset. Students will learn concepts, techniques and tools they need to deal with various facets of data science practice, including data collection and integration, exploratory data analysis, predictive modeling, descriptive modeling, data product creation, evaluation, and effective communication. The focus in the treatment of these topics will be on breadth, rather than depth, and emphasis will be placed on integration and synthesis of concepts and their application to solving problems. To make the learning contextual, real datasets from a variety of disciplines will be used.

Textbook: 1. Doing Data Science, Straight Talk from The Frontline by Cathy O 'Neil and Rachel Schutt, 1st Edition 
2. Mining of Massive Datasets by Jure Leskovek, Anand Rajaraman and Jeffrey Ullman, 2nd Edition

 

 

Course Code: CSE4458
Course Title: Data Science Lab
Credit Hour: 1.00
Prerequisite: CSE3202

Content: Lab works based CSE4457

 

 

Course Code: CSE4459
Course Title: Big Data Analytics
Credit Hour: 3.00
Prerequisite: N/A

Content: This course provides a basic introduction to big data and corresponding quantitative research methods. The objective of the course is to familiarize students with big data analysis as a tool for addressing substantive research questions. The course begins with a basic introduction to big data and discusses what the analysis of these data entails, as well as associated technical, conceptual and ethical challenges. Strength and limitations of big data research are discussed in depth using real-world examples. Students then engage in case study exercises in which small groups of students develop and present a big data concept for a specific real-world case. This includes practical exercises to familiarize students with the format of big data. It also provides a first hands-on experience in handling and analyzing large, complex data structures. The block course is designed as a primer for anyone interested in attaining a basic understanding of what big data analysis entails. There are no prerequisite requirements for this course.

Textbook: 1. Data Science & Big Data Analytics: Discovering, Analyzing, Visualizing and Presenting Data by D Dietrich, 1st Edition
2. Big Data Analytics by Venkat Ankam

 

 

Course Code: CSE4460
Course Title: Big Data Analytics Lab
Credit Hour: 1.00
Prerequisite: N/A

Content: Lab works based CSE 459

 

 

Course Code: CSE4461
Course Title: Digital Image Processing
Credit Hour: 3.00
Prerequisite: CSE1201, MAT 1101

Content: Introduction to image processing: Image processing applications, image processing goals, image function, image representation, sampling and quantization, gray scale, binary (black and white), and color images, histograms, noise in images. Color image models: RGB, HIS, YIQ models. Image enhancement, convolution and filtering: Point processing, histogram equalization, histogram modeling, and histogram specification, spatial filtering – image smoothing, median filtering Edge detections: Sobel, Prewit, Laplacian and Canny edge detectors Image segmentation: Thresholding Shape detection, image matching and texture: image moments, central moments, moment invariants, template matching, area correlation, texture description, Image morphology: Basic morphological concepts, structuring elements, erosion, dilation, thinning, thickening, opening, and closing operations. 

Textbook: 1. Digital Image Processing by Gonzalez and Woods, 4th Edition 
2. Image Processing and Analysis by S. Birchfield, 1st Edition

 

 

Course Code: CSE4462
Course Title: Digital Image Processing Lab
Credit Hour: 1.00
Prerequisite: CSE1202

Content: Lab works based CSE 495

 

 

Course Code: CSE4463
Course Title: Introduction to Bioinformatics
Credit Hour: 3.00
Prerequisite: CSE3201, CSE3202

Contents: Introduction; Molecular biology basics: DNA, RNA, genes, and proteins; Graph algorithms: DNA sequencing, DNA fragment assembly, Spectrum graphs; Sequence similarity; Suffix Tree and variants with applications; Genome Alignment: maximum unique match, LCS, mutation sensitive alignments; Database search: Smith-Waterman algorithm, FASTA, BLAST and its variations; Locality sensitive hashing; Multiple sequence alignment; Phylogeny reconstruction; Phylogeny comparison: similarity and dissimilarity measurements, consensus tree problem; Genome rearrangement: types of genome rearrangements, sorting by reversal and other operations; Motif finding; RNA secondary structure prediction; Peptide sequencing; Population genetics; Recent Trends in Bioinformatics.

Textbook: 1. Introduction to Bioinformatics by Arthur Lesk, 5th Edition
2. Bioinformatics And Functional Genomics by Pevsner J., 3rd Edition

 

Course Code: CSE4465
Course Title: Natural Language Processing
Credit Hour: 3.00
Prerequisite: N/A

Contents: Natural language processing (NLP) is one of the most important technologies of the information age. Understanding complex language utterances is also a crucial part of artificial intelligence. In this course, you will be given a thorough overview of Natural Language Processing and how to use classic machine learning methods. You will learn about Statistical Machine Translation as well as Deep Semantic Similarity Models (DSSM) and their applications. We will also discuss deep reinforcement learning techniques applied in NLP and Vision-Language Multimodal Intelligence.

Textbook: 1. Speech and Language Processing: An Introduction to Natural Language Processing, Computational Linguistics, and Speech Recognition, 2nd Edition, by Daniel Jurafsky and James H. Martin.
2. Neural Network Methods in Natural Language Processing by by Yoav Goldberg

 

Course Code: CSE4467
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: N/A

Content: As necessary.

 

 

Course Code: CSE4469
Course Title: Software Requirements Specification and Analysis
Credit Hour: 3.00
Prerequisite: CSE3200, CSE3203

Contents: This course offers to develop effective functional and non-functional requirements that are complete, concise, correct, consistent, testable and unambiguous, select the appropriate requirements elicitation techniques to identify requirements, design a set of software models to be used to flesh out hidden requirements and drive clarity into the system functional requirements, effectively analyze requirements and prioritize accordingly, perform requirements engineering in the context of the most common software development life cycles and processes, create a requirements specification to communicate requirements to a broad set of stakeholders, utilize various requirements validation techniques to critically evaluate their requirements to identify defects, manage change to requirements.

Textbook: 1. Software Engineering: A Practitioner 's Approach by R. S. Pressman, 8th edition
2. Software Engineering by Ian Sommerville, 10th Edition

 

 

Course Code: CSE4471
Course Title: Design Patterns
Credit Hour: 3.00
Prerequisite: CSE2103, CSE2104

Contents: Revision of Concepts of OOP, Importance of learning design patterns, Types of Design Patterns - Structural, Behavioral and Creational Patterns, Creational Patterns – Singleton, Factory, Factory Method, Abstract Factory, Builder, Prototype and Object Pool, Behavioral Patterns - Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, Strategy, Template Method, Visitor and Null Object, Structural Patterns – Adapter, Bridge, Composite, Decorator, Flyweight and Proxy, REFACTORING CODE SMELL, Different type of code smells - Inappropriate Naming, Comments, Dead Code, Duplicated code, Primitive Obsession, Large Class, Lazy Class, Alternative Class with Different Interface, Long Method, Long Parameter List, Switch Statements, Speculative Generality, Oddball Solution, Feature Envy, Refused Bequest, Black Sheep and Train Wreck, Design Principles (SOLID) - Single responsibility principle, Open Close Principle, Liskov substitution principle, Interface segregation principle, Dependency Inversion principle.

Textbook: 1. Gamma, Erich. Design patterns: elements of reusable object-oriented software. Pearson Education, 1995

 

 

Course Code: CSE4473
Course Title: Software Testing and Quality Assurance
Credit Hour: 3.00
Prerequisite: CSE3200, CSE3203 

Content: Software Testing Life Cycle (STLC), SDLC vs STLC; Testing Levels; Testing methods; Testing types: Specification-based vs. code-based, black-box vs. white-box, functional vs. structural testing; unit, integration, system, acceptance, and regression testing; Load, Performance, Stress, Unit Testing; Verification vs. validation; Test planning: scenario, case, traceability matrix; ISO Standards; Agile testing; Testing Estimation techniques; Introduction to software reliability, quality control and quality assurance; Formal verification methods; static and dynamic program verification. Testing Internet Applications - Security and Performance Testing, Debugging, Test Driven Development (TDD), Behavior Driven Development (BDD). 

Textbook: 1. Mastering Software Quality Assurance: Best Practices, Tools and Techniques for Software Developers by Murali Chemuturi
2. The Art of Software Testing by Glenford J. Myers, Corey Sandler, and Tom Badgett, 3rd Edition

 

 

Course Code: CSE4474
Course Title: Software Testing and Quality Assurance Lab
Credit Hour: 1.00
Prerequisite: CSE3200, CSE3203 

Content: Lab works based CSE4473

 

 

Course Code: CSE4475
Course Title: Mobile Application Development
Credit Hour: 3.00
Prerequisite: CSE2103 & CSE2104

Content: Introduction to Android, Java Overview, Android Widgets, Layout Designs, Utilization of media files – text, mp3, jpeg, jpg, Activity States, Internal/External and Temporary/Permanent Data Storage.

Textbook: 1. Building Android Apps with HTML, CSS, and JavaScript: Making Native Apps with Standards-Based Web Tools by Jonathan Stark, Brian Jepson, Brian MacDonald, 2nd Edition
2. IOS Programming: The Big Nerd Ranch Guide by Christian Keur, Aaron Hillegass, by 6th Edition

 

Course Code: CSE4477
Course Title: Advanced Programming
Credit Hour: 3.00
Prerequisite:  CSE1201, CSE1202, CSE2305, CSE2306

Content: This is an advanced course in UNIX system facilities. It complements the operating systems course, in that it provides hands-on experience with such facilities as signals, semaphores and file locks. Familiarity with the C language is assumed. About 40% of the course is devoted to UNIX shell programming and some useful utilities like sed and awk. The rest of the course does the UNIX system calls in detail – unbuffered I/O, directories, process creation, signals, pipes, record locks, interposes communication, terminal handling and some tcp/ip calls.

Textbook: 1. Advanced Programming in the UNIX Environment by W. Richard Stevens, Stephen A. Rago, 3rd Edition
2. The Linux Programming Interface: A Linux and UNIX System Programming Handbook by Michael Kerrisk, 1st Edition

 

 

Course Code: CSE4478
Course Title: Advanced Programming Lab
Credit Hour: 1.00
Prerequisite:  CSE1201, CSE1202, CSE2305, CSE2306

Content: Lab works based CSE4477

 

 

Course Code: CSE4479
Course Title: Human Computer Interaction
Credit Hour: 3.00
Prerequisite:  N/A

Content: This course explain the capabilities of both humans and computers from the viewpoint of human information processing, describe typical human–computer interaction (HCI) models and styles, as well as various historic HCI paradigms, apply an interactive design process and universal design principles to designing HCI systems, describe and use HCI design principles, standards and guidelines, analyze and identify user models, user support, socio-organizational issues, and stakeholder requirements of HCI systems, discuss tasks and dialogs of relevant HCI systems based on task analysis and dialog design, analyze and discuss HCI issues in groupware, ubiquitous computing, virtual reality, multimedia, and Word Wide Web-related environments.

Textbook: 1. Human Computer Interaction by A. Dix and J. E. Finlay, 4th Edition
2. Interaction Design: Beyond Human-Computer Interaction by Helen Sharp, Jennifer Preece, Yvonne Roger, 5th Edition

 

 

Course Code: CSE4481
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: N/A

Content: As necessary.


 

Course Code: CSE4483
Course Title: Enterprise Systems: Concepts and Practice
Credit Hour: 3.00
Prerequisite:  N/A

Content: This course describes properties and architecture of enterprise systems, account for strategies and approaches for implementation and use of enterprise systems, explain how enterprise systems support organizations, analyses implementation and use of enterprise systems from a socio-technical perspective, apply socio-technical models and provide recommendations for implementation and use of enterprise systems implementation, discuss and present critical issues related to implementation and use of enterprise systems, critically assess the role of enterprise systems in organizations, argue for different enterprise systems solutions.

 

 

Course Code: CSE4484
Course Title: Enterprise Systems: Concepts and Practice Lab
Credit Hour: 1.00
Prerequisite:  N/A

Content: Lab works based CSE4483

 

 

Course Code: CSE4485
Course Title: Electronic Business
Credit Hour: 3.00
Prerequisite:  N/A

Content: Electronic Business is an interdisciplinary topic encompassing both business and technology. Basic business aspects and applications throughout the business world include commercial business, government, education, and health services. The major characteristics, opportunities, and limitations of this form of business are explored. Students study various issues and risks that exist in the rapidly changing world of electronic business.

Textbook: 1. E-Commerce 2019: Business, Technology and Society, Global Edition by Kenneth C. Laudon, Carol Guercio Traver, 15th Edition
2. Digital Business and E-Commerce Management by Dave Chaffey, Tanya Hemphill, David Edmundson-Bird, 7th Edition

 

 

Course Code: CSE4487
Course Title: UI: Concepts and Design
Credit Hour: 3.00
Prerequisite:  N/A

Content: This course introduced to User Interface Design, User Interface Design process, User-Centered Web Design, User Interface Design Principles and Legal Guidelines, Color, Typography, Layout and Wireframing, designing a Basic Web Site, Navigation Concepts, Designing and Developing a Professional Web Site, Site Publishing, Maintenance, Security, and SEO Strategies.

Textbook: 1. Intuitive Design: Eight Steps to an Intuitive UI by Everett N McKay, Rob Nance, First Edition
2. Usability Matters: Practical UX for Developers and other Accidental Designers by Matt Lacey, 1st Edition 


 

Course Code: CSE4489
Course Title: IT Audit: Concepts and Practice 
Credit Hour: 3.00
Prerequisite:  N/A

Content: This course will provide attendees with an introduction to IT auditing, emphasizing the concepts through exercises and case studies. Internal audit professionals will develop knowledge of basic IT audit concepts that can be used to facilitate integrated audit efforts within their organization.

Textbook: 1. Information Technology Control and Audit by Angel R. Otero, 5th Edition
2. IT Auditing Using Controls to Protect Information Assets by Mike Kegerreis, Mike Schiller, Chris Davis, 3rd Edition

 

 

Course Code: CSE4491
Course Title: ICT for Development 
Credit Hour: 3.00
Prerequisite:  N/A

Content: Conceptual frameworks to understand the prospects and challenges and roles of information and of information and communications technologies (ICTs) in social and economic development; knowledge and skills to help in the effective planning, development, implementation and management of ICT for development initiatives; case studies.

Textbook: 1. Technologies of Choice: ICTs, Development, and the Capabilities Approach by Dorothea Kleine, 1st Edition
2. The Emerging Technology of Big Data: It 's Impact as a Tool for ICT Development by Heru Susanto, Fang-Yie Leu, Chin Kang Chen, 1st Edition


 

Course Code: CSE 4493
Course Title: Topics of Current Interest
Credit Hour: 3.00
Prerequisite: N/A

Content: As necessary.

Course Code: CSE4701
Course Title: E-Commerce
Credit Hour: 3.00
Prerequisite:  N/A

Content: An introduction to e-commerce principles, theories, technologies and applications. This course gives an overview of the impact of new technologies on commercial paradigms and practices, legal issues and business ethics. The course also comprises advanced managerial issues regarding the use of cutting-edge e-Business applications. It provides students with a deeper understanding of new technologies and recent theory in e-commerce and their implications for e-business thought and practice.

Textbook: 1. Electronic Commerce: The Strategic Perspective by R.T. Watson, P. Berthon, L. F. Pitt, G. M. Zinkhan, 1st Edition, BCcampus


 

Course Code: CSE4703
Course Title: Management Information System
Credit Hour: 3.00
Prerequisite:  N/A

Content: Introduction to MIS, Components on IS, Structures of IS, Implementation of different IS, DSS, AIS, Project Planning, Production cycle, Data processing, Processing cycle, etc.

Textbook: 1. Management Information Systems: Managing the Digital Firm by K.C. Laudon, J. P. Laudon, 16th edition, Pearson


 

Course Code: CSE4705
Course Title: Multimedia Design and Development
Credit Hour: 3.00
Prerequisite:  N/A

Content: Analysis, design and implementation of multimedia software, primarily for e-learning courses or training. Projects emphasize user interface design, content design with storyboards or scripts, creation of graphics, animation, audio and video materials, and software development using high level authoring tools. 

Textbook: 1. e-Learning and the Science of Instruction: Proven Guidelines for Consumers and Designers of Multimedia Learning by R. Clark, R. Mayer, 4th edition Pearson


 

Course Code: CSE4707
Course Title: Web Application Design
Credit Hour: 3.00
Prerequisite:  N/A

Content: Introduction to Web Technologies. HTML5, CSS3 with it 's new components. JavaScript, jQuery, AJAX. Data transmission formats and processes. XML and JSON. Cyber Security and Secured Protocols. 

Textbook: As per instructor 's guideline

 

 

Course Code: CSE4709
Course Title: Social and Professional Issues in Computing
Credit Hour: 3.00
Prerequisite:  N/A

Content: Introduction to the social implications of computing, Social implications of networked communication, Growth of, Control of, and access to the Internet, Gender – Related issues, Cultural issues, International Issues, Accessibility Issues (e.g. underrepresentation of minorities, Women and disabled in the computing profession), Public policy issues (e.g. electronic voting). Making and evaluating ethical arguments, Identifying and evaluating ethical choices, Understanding the social context of design, Identifying assumptions and values. Professional Ethics: Community values and the laws by which we live, The nature of professionalism (Including care, attention and discipline, fiduciary responsibility, and mentoring). Keeping up-to-date as a professional (in terms of knowledge, tools, skills, legal and professional framework as well as the ability to self-assess and computer fluency), Various forms of professional credentialing and the advantages and disadvantages, Codes of ethics, conduct, and practice(IEEE, ACM, SE, AITP, and so forth), Dealing with harassment and discrimination, Historical examples of software risks (such as the Therac-25 case), Implications of software complexity, Risk assessment and Risk Management; Risk removal, risk reduction and risk control. Security Operations: Physical security, Physical access controls, Personnel access controls, Operational security, Security polices for systems/networks, Recovery and Response, Dealing with problems (both technical and human). Foundations of Intellectual Property, Copyrights, patents, and trade secrets, Software Piracy, Software Patents, Transactional issues concerning Intellectual Property. History and examples of computer crime, “Cracking” (“Hacking”) and its effects, Viruses, Worms, and Trojan Horses, Identity Theft, Crime Prevention strategies. 

Textbook: As per instructor 's guideline


 

Course Code: CSE4711
Course Title: AI & ML For Social Good
Credit Hour: 3.00
Prerequisite:  N/A

Content: Advancement of AI technology has enabled more expansion of its application area. From medical treatment, gaming, manufacturing to daily business processes. A huge amount of money has been poured in AI research due to its exciting discoveries. However, the rapid growth and excitement that the technology offers obscure us from looking at the impact it brings in our society. This course gives an introduction to AI & Machine Learning and discusses various impacts of AI & ML in our lives and society today.

Textbook: As per instructor 's guideline


 

Course Code: CSE4713
Course Title: Tech Startup
Credit Hour: 3.00
Prerequisite:  N/A

Content: This course will work on building the entrepreneurial mindset and introducing basic entrepreneurship principles, technology innovation and creativity through interactive lectures, workshops, and case studies in contemporary issues to include energy, life sciences, healthcare, social issues to be tackled through technology. This course will help students learn the processes and skills needed to launch and manage new technology ventures, with a focus on business plan development. Topics related to critical legal and business issues entrepreneurs face as they build and launch a new technology venture will be covered. Attention will be placed on new venture formation, intellectual property management, and financing arrangements to establish a tech startup.

Textbook: As per instructor 's guideline


 

Course Code: CSE4715
Course Title: Data Analytics
Credit Hour: 3.00
Prerequisite:  N/A

Content: Data analysis is an evolving area of studies with focus on various predictive modeling techniques coupled with ample analytical tools that help increase our capacity to handle data. This course helps students to develop a basic understanding of data analysis that they will need to make decisions using data, and to communicate the results effectively. The course is an introduction to the key concepts of statistics for data analysis, essential tools and methodologies for predictive modeling tasks.

Textbook: As per instructor 's guideline


 

Course Code: CSE4719
Course Title: IT Project Management
Credit Hour: 3.00
Prerequisite:  N/A

Content: Introduction to IT project management concepts and frameworks; the role of the project manager; conceptualizing and visualizing projects in terms of the overall cycle from initiation through to sign off; project management processes and knowledge areas; project management tools and techniques; interfaces between the project manager and various stakeholders; working in teams; career planning

Textbook: 1. Brilliant PRINCE2: What you really need to know about PRINCE2 by S. Barker, Pearson


 

Course Code: CSE4721
Course Title: AR/VR
Credit Hour: 3.00
Prerequisite:  N/A

Content: This course will introduce you to the world of Augmented, Mixed, and Virtual Reality interfaces. These interfaces enable new kinds of user experiences by superimposing digital content onto the user 's real-world view or creating fully immersive virtual world experiences. You will learn about the differences between AR/VR, about the technical and design requirements for creating such user experiences, and how to prototype and develop your first AR/VR interfaces. You will also receive an overview of new and evolving interaction design principles and methods, current AR/VR interface development approaches, and how to assess the usability of AR/VR interfaces.

Textbook: As per instructor 's guideline


 
"""

# 2. PARSING LOGIC
courses = []
current_course = {}
lines = raw_data.split('\n')
reading_content = False

for line in lines:
    clean_line = line.strip()
    
    # Skip empty lines unless we are currently reading a multi-line content block
    if not clean_line:
        if reading_content:
            # We assume a blank line in the text ends the content block for safety, 
            # or you can simply continue. Here we continue but don't add text.
            continue
        else:
            continue

    if clean_line.startswith("Course Code:"):
        # Save previous course if exists
        if current_course:
            courses.append(current_course)
        
        # Start new course
        current_course = {
            'Course Code': clean_line.replace("Course Code:", "").strip(),
            'Course Title': '',
            'Credit Hour': '',
            'Prerequisite': '',
            'Content': ''
        }
        reading_content = False

    elif clean_line.startswith("Course Title:"):
        current_course['Course Title'] = clean_line.replace("Course Title:", "").strip()
        reading_content = False

    elif clean_line.startswith("Credit Hour:"):
        current_course['Credit Hour'] = clean_line.replace("Credit Hour:", "").strip()
        reading_content = False

    elif clean_line.startswith("Prerequisite:"):
        current_course['Prerequisite'] = clean_line.replace("Prerequisite:", "").strip()
        reading_content = False

    # Note: Text uses both "Content:" and "Contents:"
    elif clean_line.startswith("Content:") or clean_line.startswith("Contents:"):
        # Remove the label and whitespace
        content_text = re.sub(r"Contents?:", "", clean_line).strip()
        current_course['Content'] = content_text
        reading_content = True

    elif clean_line.startswith("Textbook:"):
        reading_content = False
    
    elif reading_content:
        # If we are in reading mode and it's not a new key, append to content
        current_course['Content'] += " " + clean_line

# Append the last course processed
if current_course:
    courses.append(current_course)

# 3. WRITE TO CSV
output_filename = 'courses.csv'
headers = ['Course Code', 'Course Title', 'Credit Hour', 'Prerequisite', 'Content']

try:
    with open(output_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        
        for course in courses:
            # Only write row if it has a Course Code
            if course.get('Course Code'):
                writer.writerow(course)

    print(f"Successfully converted {len(courses)} courses to '{output_filename}'.")

except IOError:
    print("Error writing to file.")